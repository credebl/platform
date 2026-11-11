import { Issue } from './error';
import { _STR } from './helpers/str-helpers';
import { _URL } from './helpers/url-helpers';

// ----------

export type Validator<T> = (input: T | undefined) => Issue | undefined;

/* --------------------------------------------------------------------------------
 * STRING VALIDATORS (GENERIC)
 * -------------------------------------------------------------------------------- */

export function boolean(): Validator<string> {
  return (input) => {
    const success = _STR._includes(['true', 'false'], input);

    if (!success) {
      return {
        expected: `'true' | 'false'`,
        received: input,
        message: `Must be a valid boolean value ('true' or 'false')`
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function notEmpty(): Validator<string> {
  return (input) => {
    const success = _STR._isNotEmpty(input);

    if (!success) {
      return {
        expected: 'A non-empty string',
        received: input,
        message: 'String cannot be empty'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function number(): Validator<string> {
  return (input) => {
    const success = _STR._isNumber(input);

    if (!success) {
      return {
        expected: 'A numeric value',
        received: input,
        message: 'Must be a valid number'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function optional(): Validator<string> {
  return (input) => {
    const success = _STR._isOptional();
    if (!success) {
      return {
        expected: 'An optional value',
        received: input,
        message: 'Must be a valid optional value.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function startsWith(prefix: string): Validator<string> {
  return (input) => {
    const success = _STR._startsWith(input, prefix);

    if (!success) {
      return {
        expected: `A string starting with: ${prefix}`,
        received: input,
        message: `Value must start with: ${prefix}`
      };
    }
  };
}

/* ---------------------------------------------------------------------------------
 * STRING VALIDATORS (SPECIFIC TO URL)
 * --------------------------------------------------------------------------------- */

export function domain(): Validator<string> {
  return (input) => {
    const success = _URL._isDomain(input);

    if (!success) {
      return {
        expected: 'A valid domain name (e.g., example.com)',
        received: input,
        message: 'Invalid domain. Must be a valid domain name, like example.com.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function email(): Validator<string> {
  return (input) => {
    const success = _URL._isEmail(input);

    if (!success) {
      return {
        expected: 'A valid email address (e.g., user@example.com)',
        received: input,
        message: 'Invalid email. Must be a valid email address, like user@example.com.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function endpoint(): Validator<string> {
  return (input) => {
    const success = _URL._isEndpoint(input);

    if (!success) {
      return {
        expected: 'host:port (e.g., localhost:8080)',
        received: input,
        message: `Invalid endpoint. The endpoint must follow the 'host:port' format (e.g., 'localhost:8080').`
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function host(): Validator<string> {
  return (input) => {
    const success = _URL._isHost(input);

    if (!success) {
      return {
        expected: 'A valid IPv4 or IPv6 address, or a domain name (e.g., example.com)',
        received: input,
        message: 'Invalid host. Host must be a valid IPv4 or IPv6 address, or a properly formatted domain name.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function port(): Validator<string> {
  return (input) => {
    const success = _URL._isPort(input);

    if (!success) {
      return {
        expected: 'A number between 1024 and 65536',
        received: input,
        message: 'Invalid port. Port numbers must be between 1024 and 65536.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function protocol(): Validator<string> {
  return (input) => {
    const success = _URL._isProtocol(input);

    if (!success) {
      return {
        expected: `'http' | 'https'`,
        received: input,
        message: `Invalid protocol. The protocol must start with 'http' or 'https'.`
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function url(): Validator<string> {
  return (input) => {
    const success = _URL._isURL(input) || _URL._isLocalhost(input);

    if (!success) {
      return {
        expected: 'A valid URL (e.g., http://example.com or localhost)',
        received: input,
        message: 'Invalid URL. It must be a valid URL, such as http://example.com or http://localhost:3000.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function localhost(): Validator<string> {
  return (input) => {
    const port = input.split(':').at(-1);
    const success = _URL._isLocalhost(input) && _URL._isPort(port);

    if (!success) {
      return {
        expected: 'A valid localhost (e.g., http://localhost:3000, http://127.0.0.1:3000, http://[::1]:3000)',
        received: input,
        message: 'Invalid localhost.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function multipleUrl(): Validator<string> {
  return (input) => {
    const success = _URL._isMultipleURL(input);

    if (!success) {
      return {
        expected:
          'A valid collection of URLs, with the format: "http://localhost:3000, http://localhost:3001,http://localhost:3002"',
        received: input,
        message: 'Invalid collection of URLs.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function postgresUrl(): Validator<string> {
  return (input) => {
    const success = _URL._isPostgresURL(input);

    if (!success) {
      return {
        expected:
          'A valid Postgres URL with the format: postgresql://{postgres.user}:{postgres.password}@{your-ip}:{postgres.port}/{database-name}/schema={}',
        received: input,
        message: 'Invalid PostgreSQL URL format.'
      };
    }
  };
}

// --------------------------------------------------------------------------------

export function path(): Validator<string> {
  return (input) => {
    const success = _STR._isPath(input);

    if (!success) {
      return {
        expected: 'A valid path. E.g: folder/anotherFolder',
        received: input,
        message: 'Invalid path.'
      };
    }
  };
}
