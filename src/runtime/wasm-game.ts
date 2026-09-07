import type { GameDefinition } from "../game-registry";

interface EmscriptenModule {
  HEAPU8: Uint8Array;
  _kalamunggos_setup(): void;
  _kalamunggos_frame(buttons: number): void;
  _kalamunggos_framebuffer(): number;
  _kalamunggos_frame_rate(): number;
  _kalamunggos_eeprom_data(): number;
  _kalamunggos_eeprom_size(): number;
  _kalamunggos_eeprom_dirty(): number;
  _kalamunggos_clear_eeprom_dirty(): void;
  _kalamunggos_tone_count(): number;
  _kalamunggos_tones(): number;
  _kalamunggos_clear_tones(): void;
}

type ModuleFactory = (options?: Record<string, unknown>) => Promise<EmscriptenModule>;

export function eepromStorageKey(gameId: string): string {
  return `kalamunggos:eeprom:${gameId}`;
}

async function loadFactory(definition: GameDefinition): Promise<ModuleFactory> {
  const scope = window as unknown as Record<string, unknown>;
  if (typeof scope[definition.moduleFactory] !== "function") {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = definition.modulePath;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Could not load ${definition.modulePath}`));
      document.head.append(script);
    });
  }
  const factory = scope[definition.moduleFactory];
  if (typeof factory !== "function") throw new Error(`Missing module factory: ${definition.moduleFactory}`);
  return factory as ModuleFactory;
}

export class WasmGame {
  private audioContext?: AudioContext;
  readonly frameRate: number;

  private constructor(
    private readonly definition: GameDefinition,
    private readonly module: EmscriptenModule,
  ) {
    this.frameRate = Math.max(1, module._kalamunggos_frame_rate());
  }

  static async create(definition: GameDefinition): Promise<WasmGame> {
    const factory = await loadFactory(definition);
    const module = await factory({ locateFile: (file: string) => `/games/${file}` });
    const game = new WasmGame(definition, module);
    game.restoreEeprom();
    module._kalamunggos_setup();
    game.persistEeprom();
    return game;
  }

  frame(buttons: number, soundEnabled: boolean): Uint8Array {
    this.module._kalamunggos_frame(buttons);
    this.persistEeprom();
    this.playPendingTones(soundEnabled);
    const pointer = this.module._kalamunggos_framebuffer();
    return this.module.HEAPU8.slice(pointer, pointer + 128 * 64);
  }

  private eepromKey(): string {
    return eepromStorageKey(this.definition.id);
  }

  private restoreEeprom(): void {
    const encoded = localStorage.getItem(this.eepromKey());
    if (!encoded) return;
    const values = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const size = Math.min(values.length, this.module._kalamunggos_eeprom_size());
    this.module.HEAPU8.set(values.subarray(0, size), this.module._kalamunggos_eeprom_data());
  }

  private persistEeprom(): void {
    if (!this.module._kalamunggos_eeprom_dirty()) return;
    const pointer = this.module._kalamunggos_eeprom_data();
    const bytes = this.module.HEAPU8.slice(pointer, pointer + this.module._kalamunggos_eeprom_size());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    localStorage.setItem(this.eepromKey(), btoa(binary));
    this.module._kalamunggos_clear_eeprom_dirty();
  }

  private playPendingTones(enabled: boolean): void {
    const count = this.module._kalamunggos_tone_count();
    if (!count) return;

    if (enabled) {
      this.audioContext ??= new AudioContext();
      void this.audioContext.resume();
      let startsAt = this.audioContext.currentTime;
      const pointer = this.module._kalamunggos_tones() >>> 1;
      const tones = new Uint16Array(this.module.HEAPU8.buffer, pointer * 2, count * 2);
      for (let index = 0; index < count; index += 1) {
        const frequency = tones[index * 2];
        const duration = tones[index * 2 + 1] / 1000;
        if (frequency > 0) {
          const oscillator = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          oscillator.type = "square";
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0.045, startsAt);
          gain.gain.exponentialRampToValueAtTime(0.001, startsAt + duration);
          oscillator.connect(gain).connect(this.audioContext.destination);
          oscillator.start(startsAt);
          oscillator.stop(startsAt + duration);
        }
        startsAt += duration;
      }
    }
    this.module._kalamunggos_clear_tones();
  }
}
