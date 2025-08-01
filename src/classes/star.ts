export class Star {
  x: number = 0;
  y: number = 0;
  size: number = 1;
  speed: number = 1;
  opacity: number = 1;
  deltaOpacity: number = 0.01;
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.reset();
    this.y = Math.random() * this.canvas.height;
    this.opacity = Math.random();
    this.deltaOpacity = Math.random() * 0.02 + 0.005;
  }

  reset() {
    this.x = Math.random() * this.canvas.width;
    this.y = 0;
    this.size = Math.random() * 2 + 0.5;
    this.speed = Math.random() * 0.5 + 0.2;
    this.opacity = Math.random();
    this.deltaOpacity = Math.random() * 0.02 + 0.005;
  }

  update() {
    this.y += this.speed;
    if (this.y > this.canvas.height) {
      this.reset();
    }

    this.opacity += this.deltaOpacity;
    if (this.opacity >= 1 || this.opacity <= 0.3) {
      this.deltaOpacity *= -1;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
