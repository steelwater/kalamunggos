import "./styles.css";
import { combineButtons, games, getGame, type ButtonName, type GameDefinition } from "./game-registry";
import { WasmGame } from "./runtime/wasm-game";
import { loadSettings, saveSettings } from "./settings";
import { nextSkin, skins } from "./skins";

const root = document.querySelector<HTMLDivElement>("#app")!;
if (!root) throw new Error("Missing app root");

let settings = loadSettings();
let activeGame: WasmGame | undefined;
let activeDefinition: GameDefinition | undefined;
let animationFrame = 0;
let lastGameFrame = 0;
const heldButtons = new Set<ButtonName>();
const releaseTimers = new Map<ButtonName, number>();

root.innerHTML = `
  <main class="app-shell ${settings.skin === "white" ? "skin-white" : `skin-${settings.skin}`}">
    <section class="handheld" aria-label="Virtual handheld">
      <header class="handheld-header">
        <button class="back-button" type="button" aria-label="Return to game list" hidden>← Games</button>
        <span class="header-spacer" aria-hidden="true"></span>
        <span class="status-light" aria-hidden="true"></span>
      </header>
      <div class="console-body">
        <div class="display-stack">
          <div class="title-display" hidden aria-label="Current game title">
            <div class="title-display-window"><span class="title-display-text"></span></div>
          </div>
          <div class="screen-bezel">
            <canvas class="game-screen" width="128" height="64" aria-label="Game display" hidden></canvas>
            <section class="screen-ui game-library" aria-labelledby="library-title">
              <div class="firmware-heading">
                <p>Kalamunggos</p>
                <h1 id="library-title">Select game</h1>
              </div>
              <div class="game-list">
                ${games.map((game, index) => `<button class="game-card" data-game="${game.id}"><span>0${index + 1}</span><strong>${game.displayName}</strong><small>Play</small></button>`).join("")}
              </div>
            </section>
            <section class="screen-ui system-menu" hidden aria-labelledby="menu-title">
              <div class="menu-heading"><span>System</span><h2 id="menu-title">Paused</h2></div>
              <div class="menu-actions">
                <button data-action="resume">Resume</button>
                <button data-action="games">Change Game</button>
                <button data-action="skin">Skin <span class="skin-name"></span></button>
                <button data-action="sound">Sound <span class="sound-state"></span></button>
                <button data-action="vibration">Vibration <span class="vibration-state"></span></button>
                <button data-action="title">Title Display <span class="title-state"></span></button>
                <button data-action="restart">Restart Game</button>
                <button data-action="about">About</button>
              </div>
              <section class="about" hidden></section>
            </section>
          </div>
        </div>
        <div class="controls" aria-label="Game controls">
          <div class="dpad" role="group" aria-label="Directional pad">
            <button data-button="up" aria-label="Up">▲</button>
            <button data-button="left" aria-label="Left">◀</button>
            <span class="dpad-center" aria-hidden="true"></span>
            <button data-button="right" aria-label="Right">▶</button>
            <button data-button="down" aria-label="Down">▼</button>
          </div>
          <button class="system-button" aria-label="Open Kalamunggos menu"><span></span></button>
          <div class="action-buttons" role="group" aria-label="Action buttons">
            <button data-button="b" aria-label="B button"><span>B</span></button>
            <button data-button="a" aria-label="A button"><span>A</span></button>
          </div>
        </div>
      </div>
      <p class="brand-mark">KALAMUNGGOS</p>
    </section>
  </main>`;

const shell = root.querySelector<HTMLElement>(".app-shell")!;
const library = root.querySelector<HTMLElement>(".game-library")!;
const backButton = root.querySelector<HTMLButtonElement>(".back-button")!;
const titleDisplay = root.querySelector<HTMLElement>(".title-display")!;
const title = root.querySelector<HTMLElement>(".title-display-text")!;
const canvas = root.querySelector<HTMLCanvasElement>("canvas")!;
const context = canvas.getContext("2d", { alpha: false })!;
const menu = root.querySelector<HTMLElement>(".system-menu")!;
const about = root.querySelector<HTMLElement>(".about")!;

context.imageSmoothingEnabled = false;

function updateSettingsUi(): void {
  shell.classList.remove(...skins.map((skin) => skin.className));
  shell.classList.add(`skin-${settings.skin}`);
  root.querySelector<HTMLElement>(".skin-name")!.textContent = settings.skin;
  root.querySelector<HTMLElement>(".sound-state")!.textContent = settings.sound ? "On" : "Off";
  root.querySelector<HTMLElement>(".vibration-state")!.textContent = settings.vibration ? "On" : "Off";
  root.querySelector<HTMLElement>(".title-state")!.textContent = settings.titleDisplay ? "On" : "Off";
  titleDisplay.hidden = !settings.titleDisplay || !activeDefinition;
  saveSettings(settings);
}

function updateTitle(definition: GameDefinition): void {
  title.textContent = definition.displayName;
  title.classList.remove("is-scrolling");
  requestAnimationFrame(() => {
    title.classList.toggle("is-scrolling", title.scrollWidth > title.parentElement!.clientWidth);
  });
}

function buttonMask(): number {
  return combineButtons(heldButtons);
}

function render(framebuffer: Uint8Array): void {
  const image = context.createImageData(128, 64);
  for (let index = 0; index < framebuffer.length; index += 1) {
    const value = framebuffer[index] ? 238 : 10;
    const offset = index * 4;
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function tick(now: number): void {
  const frameDuration = activeGame ? 1000 / activeGame.frameRate : 0;
  if (activeGame && menu.hidden && now - lastGameFrame >= frameDuration - 0.5) {
    const elapsedFrames = Math.max(1, Math.floor((now - lastGameFrame + 0.5) / frameDuration));
    lastGameFrame += elapsedFrames * frameDuration;
    render(activeGame.frame(buttonMask(), settings.sound));
  }
  animationFrame = requestAnimationFrame(tick);
}

async function launch(definition: GameDefinition): Promise<void> {
  cancelAnimationFrame(animationFrame);
  heldButtons.clear();
  activeDefinition = definition;
  titleDisplay.hidden = !settings.titleDisplay;
  updateTitle(definition);
  library.hidden = true;
  menu.hidden = true;
  about.hidden = true;
  backButton.hidden = false;
  canvas.hidden = false;
  context.fillStyle = "#0a0a0a";
  context.fillRect(0, 0, 128, 64);
  try {
    activeGame = await WasmGame.create(definition);
    lastGameFrame = 0;
    animationFrame = requestAnimationFrame(tick);
  } catch (error) {
    showLibrary();
    window.alert(`Could not start ${definition.displayName}: ${String(error)}`);
  }
}

function showLibrary(): void {
  cancelAnimationFrame(animationFrame);
  activeGame = undefined;
  activeDefinition = undefined;
  heldButtons.clear();
  menu.hidden = true;
  about.hidden = true;
  canvas.hidden = true;
  titleDisplay.hidden = true;
  backButton.hidden = true;
  library.hidden = false;
}

function setButton(button: ButtonName, pressed: boolean, element?: HTMLElement): void {
  if (pressed) {
    const timer = releaseTimers.get(button);
    if (timer) window.clearTimeout(timer);
    releaseTimers.delete(button);
    const wasNew = !heldButtons.has(button);
    heldButtons.add(button);
    element?.classList.add("is-pressed");
    if (wasNew && settings.vibration && "vibrate" in navigator) navigator.vibrate(12);
  } else {
    heldButtons.delete(button);
    element?.classList.remove("is-pressed");
  }
}

function releaseButton(button: ButtonName, element?: HTMLElement): void {
  const timer = releaseTimers.get(button);
  if (timer) window.clearTimeout(timer);
  releaseTimers.set(button, window.setTimeout(() => {
    setButton(button, false, element);
    releaseTimers.delete(button);
  }, 50));
}

root.querySelectorAll<HTMLButtonElement>("[data-game]").forEach((button) => {
  button.addEventListener("click", () => void launch(getGame(button.dataset.game!)));
});

backButton.addEventListener("click", showLibrary);
root.querySelector<HTMLButtonElement>(".system-button")!.addEventListener("click", () => {
  if (!activeGame) return;
  heldButtons.clear();
  menu.hidden = false;
});

root.querySelectorAll<HTMLButtonElement>("[data-button]").forEach((button) => {
  const name = button.dataset.button as ButtonName;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setButton(name, true, button);
  });
  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
    button.addEventListener(eventName, () => releaseButton(name, button));
  }
  button.addEventListener("click", () => { setButton(name, true, button); releaseButton(name, button); });
});

const keyboardMap: Record<string, ButtonName> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  z: "a", Z: "a", x: "b", X: "b",
};
window.addEventListener("keydown", (event) => {
  const button = keyboardMap[event.key];
  if (button) { event.preventDefault(); setButton(button, true); }
  if (event.key === "Escape" && activeGame && menu.hidden) {
    heldButtons.clear();
    menu.hidden = false;
  }
});
window.addEventListener("keyup", (event) => {
  const button = keyboardMap[event.key];
  if (button) { event.preventDefault(); releaseButton(button); }
});
window.addEventListener("blur", () => {
  for (const timer of releaseTimers.values()) window.clearTimeout(timer);
  releaseTimers.clear();
  heldButtons.clear();
});

menu.addEventListener("click", (event) => {
  const action = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "resume") menu.hidden = true;
  if (action === "games") showLibrary();
  if (action === "skin") { settings = { ...settings, skin: nextSkin(settings.skin) }; updateSettingsUi(); }
  if (action === "sound") { settings = { ...settings, sound: !settings.sound }; updateSettingsUi(); }
  if (action === "vibration") { settings = { ...settings, vibration: !settings.vibration }; updateSettingsUi(); }
  if (action === "title") { settings = { ...settings, titleDisplay: !settings.titleDisplay }; updateSettingsUi(); }
  if (action === "restart" && activeDefinition) { menu.hidden = true; void launch(activeDefinition); }
  if (action === "about") {
    about.hidden = !about.hidden;
    if (!about.hidden) {
      fetch("/games/build-metadata.json")
        .then((response) => response.json())
        .then((metadata: { builtAt: string; games: Array<{ displayName: string; commit: string }> }) => {
          about.innerHTML = `<button class="about-close" type="button" aria-label="Close about screen">×</button><p>Kalamunggos 0.1.0</p>${metadata.games.map((game) => `<p>${game.displayName}<br><code>${game.commit.slice(0, 12)}</code></p>`).join("")}<p>Built ${new Date(metadata.builtAt).toLocaleString()}</p>`;
        })
        .catch(() => { about.textContent = "Build metadata unavailable."; });
    }
  }
});

about.addEventListener("click", (event) => {
  if ((event.target as HTMLElement).closest(".about-close")) about.hidden = true;
});

updateSettingsUi();
