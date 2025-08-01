import backgroundSrc from "./assets/background.png";
import crosshairSrc from "./assets/crosshair.png";
import shootSoundSrc from "./assets/shoot.wav";
import alienSpriteSheetSrc from "./assets/SHEET.png";
import { Star } from "./classes/star";
import { Alien } from "./classes/alien";
import startSrc from "./assets/start.png";
import pauseSrc from "./assets/pause.png";
import restartSrc from "./assets/restart.png";
import saveSrc from "./assets/save.png";
import borderSrc from "./assets/border.png";

//background

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Could not get 2D context");
}
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const background = new Image();
background.src = backgroundSrc;

const alienSpriteSheet = new Image();
alienSpriteSheet.src = alienSpriteSheetSrc;

const startImg = new Image();
startImg.src = startSrc;

const pauseImg = new Image();
pauseImg.src = pauseSrc;

const restartImg = new Image();
restartImg.src = restartSrc;

const saveImg = new Image();
saveImg.src = saveSrc;

const borderImg = new Image();
borderImg.src = borderSrc;

background.onload = () => {
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
};

//stars

const stars: Star[] = Array.from({ length: 100 }, () => new Star(canvas));

//cross

const crosshair = new Image();
crosshair.src = crosshairSrc;

let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

canvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

//shooting detection

let isShooting = false;
let shotTime = 0;
const shootSound = new Audio(shootSoundSrc);

// button system
interface Button {
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  action: () => void;
  visible: boolean;
  hover: boolean;
}

interface GameState {
  current: "menu" | "playing" | "paused" | "gameOver" | "victory";
  previous: "menu" | "playing" | "paused" | "gameOver" | "victory";
  showMenu: boolean;
}

const gameState: GameState = {
  current: "menu",
  previous: "menu",
  showMenu: true,
};

const BUTTON_WIDTH = 200;
const BUTTON_HEIGHT = 60;
const BUTTON_SPACING = 80;

let buttons: Button[] = [];

function initializeButtons() {
  const centerX = canvas.width / 2 - BUTTON_WIDTH / 2;
  const startY = canvas.height / 2 - (4 * BUTTON_SPACING) / 2;

  buttons = [
    {
      x: centerX,
      y: startY,
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      image: startImg,
      action: startGame,
      visible: true,
      hover: false,
    },
    {
      x: centerX,
      y: startY + BUTTON_SPACING,
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      image: pauseImg,
      action: togglePause,
      visible: false,
      hover: false,
    },
    {
      x: centerX,
      y: startY + BUTTON_SPACING * 2,
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      image: restartImg,
      action: restartGame,
      visible: false,
      hover: false,
    },
    {
      x: centerX,
      y: startY + BUTTON_SPACING * 3,
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      image: saveImg,
      action: saveGame,
      visible: false,
      hover: false,
    },
  ];
}

function updateButtonVisibility() {
  if (!gameState.showMenu) {
    buttons.forEach((button) => (button.visible = false));
    return;
  }

  buttons[0].visible = gameState.current === "menu";

  buttons[1].visible = false;

  buttons[2].visible = ["paused", "gameOver", "victory"].includes(
    gameState.current
  );

  buttons[3].visible = gameState.current === "paused";
}

function startGame() {
  console.log("🎮 Starting game...");
  gameState.current = "playing";
  gameState.showMenu = false;
  waveSystem.gameState = "playing";
  waveSystem.waveStartTime = performance.now();
  updateButtonVisibility();
}

function togglePause() {
  if (gameState.current === "playing") {
    console.log("⏸️ Game paused - Menu opened");
    gameState.previous = "playing";
    gameState.current = "paused";
    gameState.showMenu = true;
    pausedTime = performance.now() - waveSystem.waveStartTime;
  } else if (gameState.current === "paused") {
    console.log("▶️ Game resumed - Menu hidden");
    gameState.current = "playing";
    gameState.showMenu = false;
    waveSystem.waveStartTime = performance.now() - pausedTime;
  }
  updateButtonVisibility();
}

function restartGame() {
  waveSystem.currentWave = 1;
  waveSystem.waveSize = 4;
  waveSystem.waveStartTime = performance.now();
  waveSystem.waveSpawned = false;
  waveSystem.gameState = "playing";
  waveSystem.waveTimeLimit = calculateWaveTimeLimit(1);

  aliens.forEach((alien) => alien.destroy());
  aliens.length = 0;

  gameState.current = "playing";
  gameState.showMenu = false;
  updateButtonVisibility();
}

function saveGame() {
  console.log("💾 Saving game...");
  const saveData = {
    currentWave: waveSystem.currentWave,
    waveSize: waveSystem.waveSize,
    aliensCount: aliens.length,
    timestamp: Date.now(),
  };
  //not neccesary for now
  // localStorage.setItem("myGameSave", JSON.stringify(saveData));
  alert(
    `Game saved!\nWave: ${saveData.currentWave}\nAliens: ${saveData.aliensCount}`
  );
}

function isPointInButton(x: number, y: number, button: Button): boolean {
  return (
    x >= button.x &&
    x <= button.x + button.width &&
    y >= button.y &&
    y <= button.y + button.height
  );
}

function handleButtonHover(mouseX: number, mouseY: number) {
  buttons.forEach((button) => {
    if (button.visible) {
      button.hover = isPointInButton(mouseX, mouseY, button);
    }
  });
}

function handleButtonClick(mouseX: number, mouseY: number) {
  buttons.forEach((button) => {
    if (button.visible && isPointInButton(mouseX, mouseY, button)) {
      button.action();
    }
  });
}

function drawMenuBackground(ctx: CanvasRenderingContext2D) {
  if (!gameState.showMenu) return;

  const visibleButtons = buttons.filter((button) => button.visible);
  if (visibleButtons.length === 0) return;

  const minX = Math.min(...visibleButtons.map((b) => b.x));
  const maxX = Math.max(...visibleButtons.map((b) => b.x + b.width));
  const minY = Math.min(...visibleButtons.map((b) => b.y));
  const maxY = Math.max(...visibleButtons.map((b) => b.y + b.height));

  const padding = 60;
  const menuX = minX - padding;
  const menuY = minY - padding;
  const menuWidth = maxX - minX + padding * 2;
  const menuHeight = maxY - minY + padding * 2;

  ctx.save();

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0B1D44";
  ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

  ctx.strokeStyle = "#FE7712";
  ctx.lineWidth = 4;
  ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;

  ctx.fillStyle = "#0B1D44";
  ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

  ctx.restore();
}

function drawButtons(ctx: CanvasRenderingContext2D) {
  if (!gameState.showMenu) return;

  drawMenuBackground(ctx);

  buttons.forEach((button) => {
    if (!button.visible) return;

    ctx.save();

    if (button.hover) {
      ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.9;
    }

    ctx.drawImage(
      button.image,
      button.x,
      button.y,
      button.width,
      button.height
    );

    ctx.restore();
  });
}

let pausedTime = 0;

//waves system

interface WaveSystem {
  currentWave: number;
  totalWaves: number;
  waveSize: number;
  waveIncrement: number;
  waveSpawned: boolean;
  waveStartTime: number;
  waveTimeLimit: number;
  baseTimeLimit: number;
  gameState:
    | "playing"
    | "waveComplete"
    | "waveFailed"
    | "gameComplete"
    | "gameOver";
}

const waveSystem: WaveSystem = {
  currentWave: 1,
  totalWaves: 20,
  waveSize: 4,
  waveIncrement: 4,
  waveSpawned: false,
  waveStartTime: 0,
  waveTimeLimit: 60000,
  baseTimeLimit: 60000,
  gameState: "playing",
};

function calculateWaveTimeLimit(waveNumber: number): number {
  const minTime = 20000;
  const maxTime = 60000;
  const reduction = (maxTime - minTime) / (waveSystem.totalWaves - 1);
  return Math.max(minTime, maxTime - reduction * (waveNumber - 1));
}

function startNewWave() {
  waveSystem.currentWave++;
  waveSystem.waveSize += waveSystem.waveIncrement;
  waveSystem.waveTimeLimit = calculateWaveTimeLimit(waveSystem.currentWave);
  waveSystem.waveStartTime = performance.now();
  waveSystem.waveSpawned = false;
  waveSystem.gameState = "playing";
}

function checkWaveStatus() {
  if (waveSystem.gameState !== "playing" || gameState.current !== "playing")
    return;

  const currentTime = performance.now();
  const elapsedTime = currentTime - waveSystem.waveStartTime;
  const aliveAliens = aliens.filter(
    (alien) => alien.isAlive || alien.isDying
  ).length;

  if (elapsedTime >= waveSystem.waveTimeLimit && aliveAliens > 0) {
    waveSystem.gameState = "waveFailed";
    gameState.current = "gameOver";
    gameState.showMenu = true;
    aliens.forEach((alien) => alien.destroy());
    aliens.length = 0;
    console.log(`💀 Wave ${waveSystem.currentWave} failed! Time's up!`);
    updateButtonVisibility();
    return;
  }

  if (aliveAliens === 0 && waveSystem.waveSpawned) {
    if (waveSystem.currentWave >= waveSystem.totalWaves) {
      waveSystem.gameState = "gameComplete";
      gameState.current = "victory";
      gameState.showMenu = true;
      console.log(
        `🎉 Game Complete! You survived all ${waveSystem.totalWaves} waves!`
      );
    } else {
      waveSystem.gameState = "waveComplete";
      console.log(`✅ Wave ${waveSystem.currentWave} complete!`);
    }
    updateButtonVisibility();
  }
}

//alien

const aliens: Alien[] = [];

function spawnAlien() {
  const x = Math.random() * (canvas.width - 64);
  const y = Math.random() * (canvas.height - 64);
  aliens.push(new Alien(canvas, alienSpriteSheet, x, y));
}

function checkAndSpawnAliens() {
  if (waveSystem.gameState !== "playing" || gameState.current !== "playing")
    return;

  const aliveAliens = aliens.filter(
    (alien) => alien.isAlive || alien.isDying
  ).length;

  if (aliveAliens === 0 && !waveSystem.waveSpawned) {
    if (waveSystem.waveStartTime === 0) {
      waveSystem.waveStartTime = performance.now();
      waveSystem.waveTimeLimit = calculateWaveTimeLimit(waveSystem.currentWave);
    }

    for (let i = 0; i < waveSystem.waveSize; i++) {
      spawnAlien();
    }
    waveSystem.waveSpawned = true;
  }
}

function checkAlienHits() {
  if (gameState.current !== "playing") return;

  let hitFound = false;
  for (const alien of aliens) {
    if (
      alien.isAlive &&
      !alien.isDying &&
      alien.checkCollision(mouseX, mouseY)
    ) {
      alien.hit();
      hitFound = true;
      break;
    }
  }

  if (!hitFound) return;
}

function cleanupDeadAliens() {
  for (let i = aliens.length - 1; i >= 0; i--) {
    if (!aliens[i].isAlive) {
      aliens[i].destroy();
      aliens.splice(i, 1);
    }
  }
}

//UI

function drawUI(ctx: CanvasRenderingContext2D) {
  if (!["playing", "paused"].includes(gameState.current)) return;

  const currentTime = performance.now();
  const elapsedTime = currentTime - waveSystem.waveStartTime;
  const remainingTime = Math.max(0, waveSystem.waveTimeLimit - elapsedTime);
  const aliveCount = aliens.filter((a) => a.isAlive && !a.isDying).length;

  const uiFontSize = window.innerWidth < 768 ? 16 : 24;
  ctx.font = `${uiFontSize}px Arial`;
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.fillText(
    `Wave: ${waveSystem.currentWave}/${waveSystem.totalWaves}`,
    20,
    40
  );
  ctx.fillText(`Aliens: ${aliveCount}`, 20, 70);

  if (gameState.current === "playing") {
    const timeInSeconds = (remainingTime / 1000).toFixed(1);
    if (remainingTime < 10000) {
      ctx.fillStyle = "red";
    } else if (remainingTime < 20000) {
      ctx.fillStyle = "orange";
    } else {
      ctx.fillStyle = "white";
    }
    ctx.fillText(`Time: ${timeInSeconds}s`, 20, 100);

    const barWidth = 200;
    const barHeight = 10;
    const barX = 20;
    const barY = 130;

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const progress = remainingTime / waveSystem.waveTimeLimit;
    if (progress > 0.5) {
      ctx.fillStyle = "green";
    } else if (progress > 0.25) {
      ctx.fillStyle = "orange";
    } else {
      ctx.fillStyle = "red";
    }
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
  }

  // centered messages
  const messageFontSize = window.innerWidth < 768 ? 20 : 32;
  ctx.font = `${messageFontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  if (gameState.current === "paused") {
    ctx.fillStyle = "yellow";
    ctx.fillText("⏸️ GAME PAUSED ⏸️", centerX, centerY - 100);
  } else if (waveSystem.gameState === "waveComplete") {
    ctx.fillStyle = "lime";
    ctx.fillText("Wave Complete! Click to continue", centerX, centerY - 100);
  } else if (gameState.current === "gameOver") {
    ctx.fillStyle = "red";
    ctx.fillText("💀 GAME OVER 💀", centerX, centerY - 100);
  } else if (gameState.current === "victory") {
    ctx.fillStyle = "gold";
    ctx.fillText("🎉 VICTORY! All waves complete! 🎉", centerX, centerY - 100);
  }

  ctx.shadowBlur = 0;
}

//click events

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  if (gameState.showMenu) {
    handleButtonClick(clickX, clickY);
    return;
  }

  if (gameState.current === "playing" && !gameState.showMenu) {
    isShooting = true;
    shotTime = performance.now();
    shootSound.currentTime = 0;
    shootSound.play();

    checkAlienHits();

    shootSound
      .play()
      .then(() => {
        console.log("shooting");
      })
      .catch((err) => {
        console.error("Error shooting", err);
      });
  }

  if (
    waveSystem.gameState === "waveComplete" &&
    gameState.current === "playing" &&
    !gameState.showMenu
  ) {
    startNewWave();
  }
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;

  if (gameState.showMenu) {
    handleButtonHover(mouseX, mouseY);

    let overButton = false;
    buttons.forEach((button) => {
      if (button.visible && button.hover) {
        overButton = true;
      }
    });

    canvas.style.cursor = overButton ? "pointer" : "default";
  } else {
    canvas.style.cursor = "none";
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (gameState.current === "playing" && !gameState.showMenu) {
      togglePause();
    } else if (gameState.current === "paused" && gameState.showMenu) {
      togglePause();
    }
  }
});

//animations

function animate() {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);

  ctx?.drawImage(background, 0, 0, canvas.width, canvas.height);

  for (const star of stars) {
    star.update();
    star.draw(ctx!);
  }

  if (gameState.current === "playing") {
    for (const alien of aliens) {
      alien.update();
      alien.draw(ctx!);
    }

    cleanupDeadAliens();
    checkAndSpawnAliens();
    checkWaveStatus();
  } else {
    for (const alien of aliens) {
      alien.draw(ctx!);
    }
  }

  if (gameState.current === "playing" && !gameState.showMenu) {
    const crosshairSize = 32;
    ctx?.drawImage(
      crosshair,
      mouseX - crosshairSize / 2,
      mouseY - crosshairSize / 2,
      crosshairSize,
      crosshairSize
    );

    if (isShooting) {
      const elapsed = performance.now() - shotTime;
      const duration = 200;

      if (elapsed < duration) {
        const progress = elapsed / duration;
        const maxRadius = 50;
        const radius = progress * maxRadius;
        const alpha = 1 - progress;

        ctx?.beginPath();
        ctx?.arc(mouseX, mouseY, radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx?.fill();
      } else {
        isShooting = false;
      }
    }
  }

  drawUI(ctx!);
  drawButtons(ctx!);
  requestAnimationFrame(animate);
}

let imagesLoaded = 0;
const totalImages = 6;

function checkImagesLoaded() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    initializeButtons();
    updateButtonVisibility();
    animate();
  }
}

background.onload = checkImagesLoaded;
alienSpriteSheet.onload = checkImagesLoaded;
startImg.onload = checkImagesLoaded;
pauseImg.onload = checkImagesLoaded;
restartImg.onload = checkImagesLoaded;
saveImg.onload = checkImagesLoaded;
