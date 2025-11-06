// 3D Vector math utility class
class Vector {
	x: number;
	y: number;
	z: number;

	constructor(x?: number, y?: number, z?: number) {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
	}

	// Instance methods - return new Vector (immutable operations)

	negative(): Vector {
		return new Vector(-this.x, -this.y, -this.z);
	}

	add(v: Vector | number): Vector {
		if (v instanceof Vector) return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
		else return new Vector(this.x + v, this.y + v, this.z + v);
	}

	subtract(v: Vector | number): Vector {
		if (v instanceof Vector) return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
		else return new Vector(this.x - v, this.y - v, this.z - v);
	}

	multiply(v: Vector | number): Vector {
		if (v instanceof Vector) return new Vector(this.x * v.x, this.y * v.y, this.z * v.z);
		else return new Vector(this.x * v, this.y * v, this.z * v);
	}

	divide(v: Vector | number): Vector {
		if (v instanceof Vector) return new Vector(this.x / v.x, this.y / v.y, this.z / v.z);
		else return new Vector(this.x / v, this.y / v, this.z / v);
	}

	equals(v: Vector): boolean {
		return this.x == v.x && this.y == v.y && this.z == v.z;
	}

	dot(v: Vector): number {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}

	cross(v: Vector): Vector {
		return new Vector(
			this.y * v.z - this.z * v.y,
			this.z * v.x - this.x * v.z,
			this.x * v.y - this.y * v.x
		);
	}

	length(): number {
		return Math.sqrt(this.dot(this));
	}

	unit(): Vector {
		return this.divide(this.length());
	}

	min(): number {
		return Math.min(Math.min(this.x, this.y), this.z);
	}

	max(): number {
		return Math.max(Math.max(this.x, this.y), this.z);
	}

	toAngles(): { theta: number; phi: number } {
		return {
			theta: Math.atan2(this.z, this.x),
			phi: Math.asin(this.y / this.length())
		};
	}

	angleTo(a: Vector): number {
		return Math.acos(this.dot(a) / (this.length() * a.length()));
	}

	toArray(n?: number): number[] {
		return [this.x, this.y, this.z].slice(0, n || 3);
	}

	clone(): Vector {
		return new Vector(this.x, this.y, this.z);
	}

	init(x: number, y: number, z: number): Vector {
		this.x = x; this.y = y; this.z = z;
		return this;
	}

	// Static methods - mutate provided vector (mutable operations for performance)

	static negative(a: Vector, b: Vector): Vector {
		b.x = -a.x; b.y = -a.y; b.z = -a.z;
		return b;
	}

	static add(a: Vector, b: Vector | number, c: Vector): Vector {
		if (b instanceof Vector) { c.x = a.x + b.x; c.y = a.y + b.y; c.z = a.z + b.z; }
		else { c.x = a.x + b; c.y = a.y + b; c.z = a.z + b; }
		return c;
	}

	static subtract(a: Vector, b: Vector | number, c: Vector): Vector {
		if (b instanceof Vector) { c.x = a.x - b.x; c.y = a.y - b.y; c.z = a.z - b.z; }
		else { c.x = a.x - b; c.y = a.y - b; c.z = a.z - b; }
		return c;
	}

	static multiply(a: Vector, b: Vector | number, c: Vector): Vector {
		if (b instanceof Vector) { c.x = a.x * b.x; c.y = a.y * b.y; c.z = a.z * b.z; }
		else { c.x = a.x * b; c.y = a.y * b; c.z = a.z * b; }
		return c;
	}

	static divide(a: Vector, b: Vector | number, c: Vector): Vector {
		if (b instanceof Vector) { c.x = a.x / b.x; c.y = a.y / b.y; c.z = a.z / b.z; }
		else { c.x = a.x / b; c.y = a.y / b; c.z = a.z / b; }
		return c;
	}

	static cross(a: Vector, b: Vector, c: Vector): Vector {
		c.x = a.y * b.z - a.z * b.y;
		c.y = a.z * b.x - a.x * b.z;
		c.z = a.x * b.y - a.y * b.x;
		return c;
	}

	static unit(a: Vector, b: Vector): Vector {
		const length = a.length();
		b.x = a.x / length;
		b.y = a.y / length;
		b.z = a.z / length;
		return b;
	}

	static fromAngles(theta: number, phi: number): Vector {
		return new Vector(Math.cos(theta) * Math.cos(phi), Math.sin(phi), Math.sin(theta) * Math.cos(phi));
	}

	static randomDirection(): Vector {
		return Vector.fromAngles(Math.random() * Math.PI * 2, Math.asin(Math.random() * 2 - 1));
	}

	static min(a: Vector, b: Vector): Vector {
		return new Vector(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
	}

	static max(a: Vector, b: Vector): Vector {
		return new Vector(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
	}

	static lerp(a: Vector, b: Vector, fraction: number): Vector {
		return b.subtract(a).multiply(fraction).add(a);
	}

	static fromArray(a: number[]): Vector {
		return new Vector(a[0], a[1], a[2]);
	}

	static angleBetween(a: Vector, b: Vector): number {
		return a.angleTo(b);
	}
}
