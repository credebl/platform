function _includes(inputs: string[], value: string | undefined): boolean {
  return !Boolean(value) || inputs?.includes(value); // SIRVE?
}

function _isNumber(input: string | undefined): boolean {
  return '' !== input?.trim() && !Number.isNaN(Number(input));
}

function _isNotEmpty(input: string | undefined): boolean {
  return input !== undefined && '' !== input.trim();
}

function _isOptional(): boolean {
  return true;
}

function _isPath(input: string | undefined): boolean {
  return (
    input !== undefined &&
    '' !== input.trim() &&
    /^\/([a-zA-Z0-9_-]+\/)*([a-zA-Z0-9_-]+\/|[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)$/.test(input)
  );
}

function _startsWith(input: string | undefined, prefix: string): boolean {
  return input?.startsWith(prefix);
}

// --------------------------------------------------------------------------------

export const _STR = {
  _includes,
  _isNotEmpty,
  _isNumber,
  _isOptional,
  _isPath,
  _startsWith
};
