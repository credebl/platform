import StringKeyword from './stringKeyword';

export default class Pattern extends StringKeyword {
  private _value: string; 

  constructor(value: string) {
    super();
    this.value = value;
  }

  get value(): string {
    return this._value; 
  }

  set value(value: string) {
    if ('string' === typeof value) {
        try {
          new RegExp(value);
          this._value = value;
        } catch (e) {
          throw new Error('value must be a valid regular expression pattern');
        }
      } else {
        throw new Error('value must be a string');
      }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(context: Record<string, any> = {}): Record<string, any> {
    context.pattern = this.value;
    return context;
  }
}
