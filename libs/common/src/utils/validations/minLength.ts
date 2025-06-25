import StringKeyword from './stringKeyword';

export default class MinLength extends StringKeyword {
  private _value: number; 

  constructor(value: number) {
    super();
    this.value = value;
  }

  get value(): number {
    return this._value; 
  }

  set value(value: number) {
    if (0 <= value && Number.isInteger(value)) {
      this._value = value;
    } else {
      throw new Error('value must be an integer and greater than or equal to 0');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(context: Record<string, any> = {}): Record<string, any> {
    context.minLength = this.value;
    return context;
  }
}
