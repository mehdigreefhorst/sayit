class Vector {
  x: number;
  y: number;
  z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // Instance methods (mutating - modify this vector)
  add(other: Vector): Vector {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
  }

  sub(other: Vector): Vector {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
  }

  mult(scalar: number): Vector {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  div(scalar: number): Vector {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
      this.z /= scalar;
    }
    return this;
  }

  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): Vector {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  limit(max: number): Vector {
    const mSq = this.x * this.x + this.y * this.y + this.z * this.z;
    if (mSq > max * max) {
      this.div(Math.sqrt(mSq));
      this.mult(max);
    }
    return this;
  }

  distanceTo(other: Vector): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Static methods (non-mutating - return new vectors)
  static sub(v1: Vector, v2: Vector): Vector {
    return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
  }

  static add(v1: Vector, v2: Vector): Vector {
    return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
  }

  static dist(v1: Vector, v2: Vector): number {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    const dz = v1.z - v2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  static mult(v: Vector, scalar: number): Vector {
    return new Vector(v.x * scalar, v.y * scalar, v.z * scalar);
  }

  static div(v: Vector, scalar: number): Vector {
    if (scalar !== 0) {
      return new Vector(v.x / scalar, v.y / scalar, v.z / scalar);
    }
    return new Vector(v.x, v.y, v.z);
  }
}

export { Vector };
export default Vector;
