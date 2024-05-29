import { Entity } from '@data-client/rest';

export class RaceDate extends Entity {
  date: number | null = null;

  // constructor(date: number | null) {
  //   super();
  //   this.date = date;
  // }

  pk(): string {
    return `${this.date}`;
  }

  toMilliseconds(): number {
    if (!this.date) {
      return 0;
    }
    return this.date * 1000;
  }

  toSeconds(): number {
    if (!this.date) {
      return 0;
    }
    return this.date;
  }

  static schema = {
    date: Number,
  };
}
