import * as dotenv from 'dotenv';
import validator from 'validator';

dotenv.config();

// --------------------------------------------------------------------------------

interface Issue {
  key: string;
  message: string;
  received: string;
}

export class EnvValidationError extends Error {
  constructor(errors: Issue[]) {
    const message = JSON.stringify(errors, null, 2);

    super(message);
    this.name = 'EnvValidationError';
  }
}

// --------------------------------------------------------------------------------

interface IValidator {
  /**
   * Validates if the given protocol is either 'http' or 'https'.
   * @param protocol - The protocol to validate.
   * @returns An object containing a message and success status.
   */
  protocol(protocol: string): ValidationResponse;

  /**
   * Validates if the given port is a number between 1024 and 65536.
   * @param port - The port to validate.
   * @returns An object containing a message and success status.
   */
  port(port: string): ValidationResponse;
}

interface ValidationResponse {
  message: string;
  success: boolean;
  received: string;
}

// --------------------------------------------------------------------------------

export class Validator implements IValidator {
  protocol = (protocol: string): ValidationResponse => {
    const success = ['http', 'https'].includes(protocol);

    return {
      message: `Invalid protocol. Must be 'http' or 'https'.`,
      success,
      received: protocol
    };
  };

  port = (port: string): ValidationResponse => {
    const portNumber = Number(port);
    const success = !Number.isNaN(portNumber) && 1024 < portNumber && 65536 > portNumber;

    return {
      message: 'Invalid port. Must be a number between 1024 and 65536.',
      success,
      received: port
    };
  };

  host = (host: string): ValidationResponse => {
    const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/g;
    const ipv6Regex =
      /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))g/;

    const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,})+$/;

    const success = ipv4Regex.test(host) || ipv6Regex.test(host) || domainRegex.test(host) || 'localhost' === host;

    return {
      message: 'Invalid host. Check the IP address.',
      received: host,
      success
    };
  };

  endpoint = (endpoint: string): ValidationResponse => {
    const [host, port] = endpoint.split(':');

    const { message: hostMessage, success: hostSuccess } = this.host(host);
    const { message: portMessage, success: portSuccess } = this.port(port);

    return {
      message: `Invalid endpoint: ${hostSuccess ? '' : hostMessage} ${portSuccess ? '' : portMessage}`,
      received: endpoint,
      success: hostSuccess && portSuccess
    };
  };

  url = (url: string): ValidationResponse => ({
    message: `Invalid URL.`,
    received: url,
    success: validator.isURL(url) || url.startsWith('http:/localhost') // FIXME:
  });

  exists = (val: string): ValidationResponse => ({
    // stub method, filler
    message: ``,
    received: val,
    success: true
  });

  email = (email: string): ValidationResponse => {
    const success = validator.isEmail(email);

    return {
      message: `Invalid email. Must be in the form example@example.com`,
      received: email,
      success
    };
  };
}
// --------------------------------------------------------------------------------

type EnvName = string;

type ValidationMethod = (value: string) => { message: string; success: boolean };

interface EnvSchema {
  [key: EnvName]: ValidationMethod;
}

export class ConfigSchema<T extends EnvSchema> {
  private readonly schema: T;

  constructor(schema: T) {
    this.schema = schema;
  }

  safeParse(): { errors: EnvValidationError | null; success: boolean; data: Record<keyof T, string> } {
    const errors: Issue[] = [];

    for (const [envName, validationMethod] of Object.entries(this.schema)) {
      const value = process.env[envName];

      // If the value is not defined, add an error message
      if (!value) {
        errors.push({ key: envName, message: 'Value must be defined.', received: process.env[envName] });
        continue;
      }

      // Validate the value using the schema function
      const { message, success } = validationMethod(value);

      if (!success) {
        errors.push({ key: envName, message, received: process.env[envName] });
      }
    }

    const hasErrors = 0 < errors.length;

    return {
      errors: hasErrors ? new EnvValidationError(errors) : null,
      success: !hasErrors,
      data: process.env as Record<keyof T, string> // { MODE: string; PORT: string; }
    };
  }
}

// --------------------------------------------------------------------------------
