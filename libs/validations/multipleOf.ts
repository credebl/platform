import NumberKeyword from './numberKeyword'

export default class MultipleOf extends NumberKeyword {
  private _value: number

  constructor(value: number) {
    super()
    this.value = value
  }

  get value(): number {
    return this._value
  }

  set value(value: number) {
    if (typeof value === 'number' && value > 0) {
      this._value = value
    } else {
      throw new Error('value must be a number greater than 0')
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  json(context: Record<string, any> = {}): Record<string, any> {
    context.multipleOf = this.value
    return context
  }
}
