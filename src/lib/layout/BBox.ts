export default class BBox {
  left: number;
  top: number;
  right: number;
  bottom: number;

  constructor() {
    this.left = Infinity;
    this.top = Infinity;
    this.right = -Infinity;
    this.bottom = -Infinity;
  }

  add(x: number, y: number) {
    if (x < this.left) this.left = x;
    if (x > this.right) this.right = x;
    if (y < this.top) this.top = y;
    if (y > this.bottom) this.bottom = y;
  }

  get width(): number {
    return this.right - this.left;
  }

  get height(): number {
    return this.bottom - this.top;
  }

  get centerX(): number {
    return (this.left + this.right) / 2;
  }

  get centerY(): number {
    return (this.top + this.bottom) / 2;
  }
}
