import validator from 'validator';
import { Issue } from './error';

// ----------

export type Validator<T> = (value: T | undefined) => Issue | undefined;

/* --------------------------------------------------------------------------------
 * STRING VALIDATORS
 * -------------------------------------------------------------------------------- */

export function _enum(inputs: string[]): Validator<string> {
  return (input) => {
    const success = inputs.includes(input || '');

    if (!success) {
      const expected = inputs.map((v) => `'${v}'`).join(' | ');

      return {
        expected,
        received: input,
        message: `Expected one of ${expected}`
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function notEmpty(): Validator<string> {
  return (value) => {
    const success = '' !== (value || '').trim();

    if (!success) {
      return {
        expected: 'A non-empty string',
        received: value,
        message: 'Must be a non-empty string'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function protocol(): Validator<string> {
  return (value) => {
    const success = (value || '').startsWith('http') || (value || '').startsWith('https');

    if (!success) {
      return {
        expected: `'http' | 'https'`,
        received: value,
        message: `Must start with 'http' or 'https'.`
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function number(): Validator<string> {
  return (value) => {
    const success = validator.isNumeric(value);

    if (!success) {
      return {
        expected: 'A number',
        received: value,
        message: 'Must be a convertable number.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function boolean(): Validator<string> {
  return (value) => {
    const success = 'true' === value || 'false' == value;

    if (!success) {
      return {
        expected: 'true or false',
        received: value,
        message: `Must be a valid convertable boolean value`
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function url(): Validator<string> {
  return (value) => {
    const success = validator.isURL(value);

    if (!success) {
      return {
        expected: 'A valid URL',
        received: value,
        message: 'Must be a valid URL.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function email(): Validator<string> {
  return (value) => {
    const success = validator.isEmail(value);

    if (!success) {
      return {
        expected: 'An email, in email@example.com format',
        received: value,
        message: 'Must be a valid email.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function port(): Validator<string> {
  return (value) => {
    const portNumber = Number(value);

    const success = validator.isNumeric(value) && 1024 < portNumber && 65536 > portNumber;

    if (!success) {
      return {
        expected: 'A number between 1024 and 65536',
        received: value,
        message: 'Invalid port.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function host(): Validator<string> {
  return (value) => {
    const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,})+$/;

    const success = validator.isIP(value) || domainRegex.test(value) || 'localhost' === value;

    if (!success) {
      return {
        expected: 'An IPv4 or IPv6 IP, or a domain.',
        received: value,
        message: 'Invalid host.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function endpoint(): Validator<string> {
  return (value) => {
    const [hostValue, portValue] = value.split(':');

    const parsedHost = host()(hostValue);
    const parsedPort = port()(portValue);

    const success = !parsedHost && !parsedPort;

    if (!success) {
      return {
        expected: 'A valid endpoint.',
        received: value,
        message: `${parsedHost.message} ${parsedPort.message}`
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function startsWith(input: string): Validator<string> {
  return (value) => {
    const success = value.startsWith(input);

    if (!success) {
      return {
        expected: `That the value provided starts with the string: ${input}`,
        received: value,
        message: `Value must start with: ${input}`
      };
    }
  };
}
