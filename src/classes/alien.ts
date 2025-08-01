export interface Animation {
  frames: number[];
  speed: number;
}

export class Alien {
  x: number;
  y: number;
  width: number = 200;
  height: number = 200;
  scale: number = 0.3;
  currentAnimation: string = "idle";
  currentFrame: number = 0;
  frameCount: number = 0;
  animationSpeed: number = 1;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  isAlive: boolean = true;
  isDying: boolean = false;
  dyingTime: number = 0;
  moveInterval: number = 0;
  canvas: HTMLCanvasElement;
  alienSpriteSheet: HTMLImageElement;

  private animations: Record<string, Animation> = {
    idle: { frames: [0, 1], speed: 40 },
    walk: { frames: [2, 3, 4], speed: 20 },
    jump: { frames: [5, 6, 7], speed: 15 },
    dying: { frames: [8, 9, 10], speed: 10 },
  };

  constructor(
    canvas: HTMLCanvasElement,
    alienSpriteSheet: HTMLImageElement,
    x: number,
    y: number
  ) {
    this.canvas = canvas;
    this.alienSpriteSheet = alienSpriteSheet;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;

    this.setRandomTarget();
    this.moveInterval = setInterval(() => {
      if (this.isAlive && !this.isDying) {
        this.setRandomTarget();
      }
    }, Math.random() * 3000 + 2500);
  }

  setRandomTarget() {
    this.targetX =
      Math.random() * (this.canvas.width - this.width * this.scale);
    this.targetY =
      Math.random() * (this.canvas.height - this.height * this.scale);
    this.setAnimation("walk");
  }

  setAnimation(animationName: string) {
    if (
      this.animations[animationName] &&
      this.currentAnimation !== animationName
    ) {
      this.currentAnimation = animationName;
      this.currentFrame = 0;
      this.frameCount = 0;
    }
  }

  checkCollision(mouseX: number, mouseY: number): boolean {
    const hitBoxSize = Math.max(
      this.width * this.scale,
      this.height * this.scale
    );
    const margin = 10;

    return (
      mouseX >= this.x - margin &&
      mouseX <= this.x + hitBoxSize + margin &&
      mouseY >= this.y - margin &&
      mouseY <= this.y + hitBoxSize + margin
    );
  }

  hit() {
    if (this.isAlive && !this.isDying) {
      this.isDying = true;
      this.dyingTime = performance.now();
      this.setAnimation("dying");

      clearInterval(this.moveInterval);

      setTimeout(() => {
        this.isAlive = false;
      }, 1000);
    }
  }

  update() {
    if (!this.isAlive) return;

    if (this.isDying) {
      const elapsed = performance.now() - this.dyingTime;
      if (elapsed > 1000) {
        this.isAlive = false;
        return;
      }
    } else {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        const speed = 1.5;
        this.x += (dx / distance) * speed;
        this.y += (dy / distance) * speed;
      } else {
        this.setAnimation("idle");
      }

      this.x = Math.max(
        0,
        Math.min(this.canvas.width - this.width * this.scale, this.x)
      );
      this.y = Math.max(
        0,
        Math.min(this.canvas.height - this.height * this.scale, this.y)
      );
    }

    const anim = this.animations[this.currentAnimation];
    this.frameCount++;

    if (this.frameCount >= anim.speed / this.animationSpeed) {
      this.currentFrame = (this.currentFrame + 1) % anim.frames.length;
      this.frameCount = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.isAlive) return;

    ctx.save();

    const anim = this.animations[this.currentAnimation];
    const frameIndex = anim.frames[this.currentFrame];

    // 11 frames:
    // [0][1]
    // [2][3][4]
    // [5][6][7]
    // [8][9][10]

    if (frameIndex < 0 || frameIndex > 10) {
      console.warn(`Frame index out of range: ${frameIndex}`);
      ctx.restore();
      return;
    }

    const frameCoordinates: { [key: number]: { x: number; y: number } } = {
      0: { x: 0, y: 0 },
      1: { x: 200, y: 0 },
      2: { x: 0, y: 200 },
      3: { x: 200, y: 200 },
      4: { x: 400, y: 200 },
      5: { x: 0, y: 400 },
      6: { x: 200, y: 400 },
      7: { x: 400, y: 400 },
      8: { x: 0, y: 600 },
      9: { x: 200, y: 600 },
      10: { x: 400, y: 600 },
    };

    const coords = frameCoordinates[frameIndex];
    if (!coords) {
      ctx.restore();
      return;
    }

    const srcX = coords.x;
    const srcY = coords.y;

    if (this.isDying) {
      const elapsed = performance.now() - this.dyingTime;
      const alpha = Math.max(0.3, 1 - elapsed / 1000);
      ctx.globalAlpha = alpha;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.alienSpriteSheet,
      srcX,
      srcY,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width * this.scale,
      this.height * this.scale
    );

    ctx.restore();

    //debug = true
    if (false) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      const hitboxSize = Math.max(
        this.width * this.scale,
        this.height * this.scale
      );
      const margin = 10;
      ctx.strokeRect(
        this.x - margin,
        this.y - margin,
        hitboxSize + margin * 2,
        hitboxSize + margin * 2
      );

      ctx.fillStyle = "yellow";
      ctx.font = "12px Arial";
      ctx.fillText(`Anim: ${this.currentAnimation}`, this.x, this.y - 25);
      ctx.fillText(
        `Frame: ${frameIndex} (${this.currentFrame}/${anim.frames.length - 1})`,
        this.x,
        this.y - 10
      );
      ctx.fillText(`Pos: ${srcX},${srcY}`, this.x, this.y + 5);
    }
  }

  destroy() {
    clearInterval(this.moveInterval);
  }
}
