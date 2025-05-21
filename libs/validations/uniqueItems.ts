import ArrayKeyword from './arrayKeyword'

export default class UniqueItems extends ArrayKeyword {
  private _value: boolean

  constructor(value: boolean) {
    super()
    this.value = value
  }

  get value(): boolean {
    return this._value
  }

  set value(value: boolean) {
    if (typeof value === 'boolean') {
      this._value = value
    } else {
      throw new Error('value must be a boolean')
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  json(context: Record<string, any> = {}): Record<string, any> {
    context.uniqueItems = this.value
    return context
  }
}
