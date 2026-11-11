import validator from 'validator';

// --------------------------------------------------------------------------------

function _isDomain(input: string | undefined): boolean {
  return validator.isFQDN(input);
}

function _isIP(input: string | undefined): boolean {
  return validator.isIP(input || '');
}

function _isPort(input: string | undefined): boolean {
  const port = Number(input);
  return !Number.isNaN(port) && 1024 <= port && 65535 >= port;
}

function _isLocalhost(input: string | undefined): boolean {
  const regex = /^(http:\/\/)?(\[?::1\]?|localhost|127\.0\.0\.1)(:\d{1,5})?(\/)?$/;

  if (!regex.test(input || '')) {
    return false;
  }

  const bracketlessInput = input.replace(/^\[?(.+?)\]?$/, '$1');
  const port = bracketlessInput.split(':').at(-1).split('/').at(0);

  return _isPort(port);
}

function _isLocalhostHost(input: string | undefined): boolean {
  // Está bien??
  const regex = /^(http:\/\/)?(\[?::1\]?|localhost|127\.0\.0\.1)(:\d{1,5})?(\/)?$/;
  return regex.test(input || '');
}

function _isHost(input: string | undefined): boolean {
  return _isIP(input) || _isDomain(input) || _isLocalhostHost(input);
}

function _isEndpoint(input: string | undefined): boolean {
  const [host, port] = (input || '').split(':');
  return _isHost(host) && _isPort(port);
}

function _isProtocol(input: string | undefined): boolean {
  const regex = /^(http|https)(:\/\/)?/;
  return regex.test(input || '');
}

function _isURL(input: string | undefined): boolean {
  return validator.isURL(input || '');
}

function _isEmail(input: string | undefined): boolean {
  return validator.isEmail(input || '');
}

function _isMultipleURL(input: string | undefined): boolean {
  return input?.split(',').every((url) => _isURL(url.trim()) || _isLocalhost(url.trim()));
}

function _isPostgresURL(input: string | undefined): boolean {
  const regex =
    /^postgresql:\/\/([a-zA-Z0-9]+):([a-zA-Z0-9]+)@(localhost|[0-9.]+):(\d{1,5})\/([a-zA-Z0-9]+)(\?schema=)?([a-zA-Z0-9]+)/;

  return regex.test(input);
}

// --------------------------------------------------------------------------------

export const _URL = {
  _isDomain,
  _isEmail,
  _isEndpoint,
  _isHost,
  _isIP,
  _isLocalhost,
  _isPort,
  _isProtocol,
  _isMultipleURL,
  _isURL,
  _isPostgresURL
};
