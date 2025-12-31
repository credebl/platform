const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');
export class DateOnly {
  private date: Date;

  public constructor(date?: string | Date) {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        throw new TypeError('Invalid Date');
      }
      this.date = date;
      return;
    }
    if (!date) {
      this.date = new Date();
      return;
    }
    // Accept only YYYY-MM-DD or full ISO strings
    const iso = /^\d{4}-\d{2}-\d{2}(T.*Z)?$/.test(date) ? date : '';
    const d = new Date(iso || date);
    if (isNaN(d.getTime())) {
      throw new TypeError('Invalid date string');
    }
    this.date = d;
  }

  get [Symbol.toStringTag](): string {
    return DateOnly.name;
  }

  toString(): string {
    return this.toISOString();
  }

  toJSON(): string {
    return this.toISOString();
  }

  toISOString(): string {
    return this.date.toISOString().split('T')[0];
  }

  [customInspectSymbol](): string {
    return this.toISOString();
  }
}

export const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
export const tenDaysInMilliseconds = 10 * oneDayInMilliseconds;
export const oneYearInMilliseconds = 365 * oneDayInMilliseconds;
export const serverStartupTimeInMilliseconds = Date.now();

export function dateToSeconds(date: Date | DateOnly): number {
  const realDate =
    date instanceof DateOnly
      ? new Date(
          Date.UTC(
            // Get the date parts from the string or from internal Date
            Number(date.toISOString().slice(0, 4)),
            Number(date.toISOString().slice(5, 7)) - 1,
            Number(date.toISOString().slice(8, 10))
          )
        )
      : date;

  if (isNaN(realDate.getTime())) {
    throw new TypeError('dateToSeconds: invalid date');
  }
  return Math.floor(realDate.getTime() / 1000);
}
