export default class Rect {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  dx: number;
  dy: number;

  constructor(options: {
    id: string;
    left: number;
    top: number;
    width: number;
    height: number;
    dx?: number;
    dy?: number;
  }) {
    this.id = options.id;
    this.left = options.left;
    this.top = options.top;
    this.width = options.width;
    this.height = options.height;
    this.dx = options.dx || 0;
    this.dy = options.dy || 0;
  }

  get right(): number {
    return this.left + this.width;
  }

  get bottom(): number {
    return this.top + this.height;
  }

  get centerX(): number {
    return this.left + this.width / 2;
  }

  get centerY(): number {
    return this.top + this.height / 2;
  }

  intersects(other: Rect): boolean {
    return !(
      this.right < other.left ||
      this.left > other.right ||
      this.bottom < other.top ||
      this.top > other.bottom
    );
  }
}
