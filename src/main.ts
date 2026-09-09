import "./styles.css";
import { combineButtons, games, getGame, type ButtonName, type GameDefinition } from "./game-registry";
import { WasmGame } from "./runtime/wasm-game";
import { loadSettings, saveSettings } from "./settings";
import { nextSkin, skins } from "./skins";

const root = document.querySelector<HTMLDivElement>("#app")!;
if (!root) throw new Error("Missing app root");

const kalamunggosVersion = "0.1.0";
const kalaOsVersion = "0.10";
let settings = loadSettings();
let activeGame: WasmGame | undefined;
let activeDefinition: GameDefinition | undefined;
let animationFrame = 0;
let lastGameFrame = 0;
const heldButtons = new Set<ButtonName>();
const releaseTimers = new Map<ButtonName, number>();
const menuPageSize = 4;
let selectedGameIndex = 0;
let selectedMenuIndex = 0;

root.innerHTML = `
  <main class="app-shell ${settings.skin === "white" ? "skin-white" : `skin-${settings.skin}`}">
    <section class="handheld" aria-label="Virtual handheld">
      <header class="handheld-header">
        <span class="status-light" aria-hidden="true"></span>
      </header>
      <div class="console-body">
        <div class="display-stack">
          <div class="title-display" hidden aria-label="Current game title">
            <div class="title-display-window"><span class="title-display-text"></span></div>
          </div>
          <div class="screen-bezel">
            <div class="screen-surface">
              <canvas class="game-screen" width="128" height="64" aria-label="Game display" hidden></canvas>
              <section class="screen-ui game-library" aria-labelledby="library-title">
                <div class="firmware-heading">
                  <p>Kala OS v${kalaOsVersion}</p>
                  <h1 id="library-title">Game select</h1>
                </div>
                <div class="game-list">
                  ${games.map((game, index) => `<button class="game-card${index === 0 ? " is-selected" : ""}" data-game="${game.id}" aria-current="${index === 0 ? "true" : "false"}"><span class="selection-cursor" aria-hidden="true">▶</span><strong>${game.displayName}</strong></button>`).join("")}
                </div>
                <p class="control-hint">D-PAD SELECT&nbsp;&nbsp; A PLAY</p>
              </section>
              <section class="screen-ui system-menu" hidden aria-labelledby="menu-title">
                <div class="menu-heading">
                  <div><h2 id="menu-title">Kala OS <span>v${kalaOsVersion}</span></h2><em>Paused</em></div>
                  <div class="page-controls"><button type="button" data-page="-1" aria-label="Previous settings page">◀</button><strong class="menu-page"></strong><button type="button" data-page="1" aria-label="Next settings page">▶</button></div>
                </div>
                <div class="menu-actions">
                  <button data-action="resume">Resume</button>
                  <button data-action="games">Change Game</button>
                  <button data-action="skin">Change Skin <span class="skin-name"></span></button>
                  <button data-action="sound">Sound <span class="sound-state"></span></button>
                  <button data-action="vibration">Vibration <span class="vibration-state"></span></button>
                  <button data-action="title">Title Display <span class="title-state"></span></button>
                  <button data-action="restart">Restart Game</button>
                  <button data-action="about">About</button>
                </div>
                <p class="control-hint">▲▼ SELECT&nbsp;&nbsp; A OK&nbsp;&nbsp; B BACK</p>
                <section class="about" hidden></section>
              </section>
            </div>
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
const titleDisplay = root.querySelector<HTMLElement>(".title-display")!;
const title = root.querySelector<HTMLElement>(".title-display-text")!;
const canvas = root.querySelector<HTMLCanvasElement>("canvas")!;
const context = canvas.getContext("2d", { alpha: false })!;
const menu = root.querySelector<HTMLElement>(".system-menu")!;
const about = root.querySelector<HTMLElement>(".about")!;
const gameButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-game]")];
const menuButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-action]")];
const menuPage = root.querySelector<HTMLElement>(".menu-page")!;
const pageButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-page]")];

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

function wrapSelection(index: number, length: number): number {
  return (index + length) % length;
}

function updateGameSelection(): void {
  gameButtons.forEach((button, index) => {
    const selected = index === selectedGameIndex;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-current", String(selected));
  });
}

function updateMenuSelection(): void {
  const pageIndex = Math.floor(selectedMenuIndex / menuPageSize);
  const pageStart = pageIndex * menuPageSize;
  menuButtons.forEach((button, index) => {
    button.hidden = index < pageStart || index >= pageStart + menuPageSize;
    const selected = index === selectedMenuIndex;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-current", String(selected));
  });
  menuPage.textContent = `${pageIndex + 1}/${Math.ceil(menuButtons.length / menuPageSize)}`;
}

function showMenu(): void {
  if (!activeGame) return;
  heldButtons.clear();
  selectedMenuIndex = 0;
  about.hidden = true;
  menu.hidden = false;
  updateMenuSelection();
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
  library.hidden = false;
  selectedGameIndex = 0;
  updateGameSelection();
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

gameButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    selectedGameIndex = index;
    updateGameSelection();
    void launch(getGame(button.dataset.game!));
  });
});

root.querySelector<HTMLButtonElement>(".system-button")!.addEventListener("click", showMenu);

function handleKalaInput(button: ButtonName): boolean {
  if (!about.hidden) {
    if (button === "a" || button === "b") about.hidden = true;
    return true;
  }
  if (!library.hidden) {
    if (button === "up" || button === "left") selectedGameIndex = wrapSelection(selectedGameIndex - 1, gameButtons.length);
    if (button === "down" || button === "right") selectedGameIndex = wrapSelection(selectedGameIndex + 1, gameButtons.length);
    if (button === "a") gameButtons[selectedGameIndex].click();
    updateGameSelection();
    return true;
  }
  if (!menu.hidden) {
    if (button === "up" || button === "left") selectedMenuIndex = wrapSelection(selectedMenuIndex - 1, menuButtons.length);
    if (button === "down" || button === "right") selectedMenuIndex = wrapSelection(selectedMenuIndex + 1, menuButtons.length);
    if (button === "a") menuButtons[selectedMenuIndex].click();
    if (button === "b") menu.hidden = true;
    updateMenuSelection();
    return true;
  }
  return false;
}

root.querySelectorAll<HTMLButtonElement>("[data-button]").forEach((button) => {
  const name = button.dataset.button as ButtonName;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    if (handleKalaInput(name)) {
      button.classList.add("is-pressed");
      if (settings.vibration && "vibrate" in navigator) navigator.vibrate(12);
      return;
    }
    setButton(name, true, button);
  });
  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
    button.addEventListener(eventName, () => releaseButton(name, button));
  }
  button.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    if (!handleKalaInput(name)) setButton(name, true, button);
    releaseButton(name, button);
  });
});

const keyboardMap: Record<string, ButtonName> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  z: "a", Z: "a", x: "b", X: "b",
};
window.addEventListener("keydown", (event) => {
  const button = keyboardMap[event.key];
  if (button) {
    event.preventDefault();
    if (!event.repeat && !handleKalaInput(button)) setButton(button, true);
  }
  if (event.key === "Escape" && activeGame) {
    if (!about.hidden) about.hidden = true;
    else if (menu.hidden) showMenu();
    else menu.hidden = true;
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

pageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedMenuIndex = wrapSelection(selectedMenuIndex + Number(button.dataset.page) * menuPageSize, menuButtons.length);
    updateMenuSelection();
  });
});

menu.addEventListener("click", (event) => {
  const actionButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-action]");
  const action = actionButton?.dataset.action;
  if (!action) return;
  selectedMenuIndex = menuButtons.indexOf(actionButton);
  updateMenuSelection();
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
          about.innerHTML = `<button class="about-close" type="button" aria-label="Close about screen">×</button><p>Kalamunggos ${kalamunggosVersion}</p>${metadata.games.map((game) => `<p>${game.displayName}<br><code>${game.commit.slice(0, 12)}</code></p>`).join("")}<p>Built ${new Date(metadata.builtAt).toLocaleString()}</p>`;
        })
        .catch(() => { about.textContent = "Build metadata unavailable."; });
    }
  }
});

about.addEventListener("click", (event) => {
  if ((event.target as HTMLElement).closest(".about-close")) about.hidden = true;
});

updateSettingsUi();
