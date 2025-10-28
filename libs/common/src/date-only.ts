const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');
export class DateOnly {
  private date: Date;

  public constructor(date?: string) {
    this.date = date ? new Date(date) : new Date();
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
  const realDate = date instanceof DateOnly ? new Date(date.toISOString()) : date;
  return Math.floor(realDate.getTime() / 1000);
}
