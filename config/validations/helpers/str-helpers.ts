function _includes(inputs: string[], value: string | undefined): boolean {
  return value !== undefined && inputs.includes(value);
}

function _isNumber(input: string | undefined): boolean {
  return !Number.isNaN(Number(input));
}

function _isNotEmpty(input: string | undefined): boolean {
  return input !== undefined && '' !== input.trim();
}

function _isOptional(input: string | undefined): boolean {
  return input === undefined || '' === input.trim();
}

function _startsWith(input: string | undefined, prefix: string): boolean {
  return input !== undefined && input.startsWith(prefix);
}

// --------------------------------------------------------------------------------

export const _STR = {
  _includes,
  _isNotEmpty,
  _isNumber,
  _isOptional,
  _startsWith
};
