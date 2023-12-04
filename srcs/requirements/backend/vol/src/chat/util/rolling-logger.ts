export class RollingLogger<T> {
  private content_: T[];

  constructor(
    private limit_: number,
  ) {
    this.content_ = [];
  }

  add(value: T) {
    if (this.content_.length === this.limit_) {
      this.content_.shift(); 
    }
    this.content_.push(value);
  }

  delete(value: T) {
    const position = this.content_.indexOf(value);

    if (position > -1) {
      this.content_.splice(position, 1);
    }
  }

  has(value: T) {
    return (this.content_.indexOf(value) > -1);
  }

  values(): T[] {
    return this.content_;
  }

  clear() {
    this.content_.splice(0, this.content_.length);
  }

  get size(): number {
    return this.content_.length;
  }

  [Symbol.iterator]() {
    let index = 0;

    return {
      next: () => {
        if (index < this.content_.length) {
          return {
            value: this.content_[index++],
            done: false,
          };
        } else {
          return {
            done: true,
          };
        }
      }
    };
  }
}
