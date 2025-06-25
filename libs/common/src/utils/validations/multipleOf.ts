import NumberKeyword from './numberKeyword';

export default class MultipleOf extends NumberKeyword {
  private _value: number; 

  constructor(value: number) {
    super();
    this.value = value;
  }

  get value(): number {
    return this._value; 
  }

  set value(value: number) {
    if ('number' === typeof value && 0 < value) {
        this._value = value;
      } else {
        throw new Error('value must be a number greater than 0');
      }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(context: Record<string, any> = {}): Record<string, any> {
    context.multipleOf = this.value;
    return context;
  }
}
