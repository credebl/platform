import * as dotenv from 'dotenv';
import validator from 'validator';

dotenv.config();

// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------

class EnvValidationError extends Error {
  constructor(message) {
    super(`\n${message}`);
    this.name = 'EnvValidationError';
  }
}

// function validateEnvVariablesResults(errors: string[]): void {
//   if (0 < errors.length) {
//     throw new EnvValidationErrorr(errors.join('\n'));
//   }
// }

function envErrorMessage(envName: string, envValue: string, message: string): string {
  return `[Env_Error] ${envName}: '${envValue}' ${message}`;
}

// --------------------------------------------------------------------------------

/**
 * Validation functions for environment variables
 */

export function isValidProtocol(protocol: string): boolean {
  return ['http', 'https'].includes(protocol);
}

export function isValidHost(host: string): boolean {
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/g;
  const ipv6Regex =
    /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))g/;
  return ipv4Regex.test(host) || 'localhost' === host || ipv6Regex.test(host);
}

export function isValidPort(port: string): boolean {
  const portNumber = Number(port);
  return !isNaN(portNumber) && 1024 < portNumber && 65536 > portNumber;
}

export function isValidEndpoint(endpoint: string): { errorMessage: string; isValid: boolean } {
  const [host, port] = endpoint.split(':');
  return {
    errorMessage: envErrorMessage('VARIABLE', endpoint, 'is not a valid endpoint.'),
    isValid: isValidHost(host) && isValidPort(port)
  };
}

export function isValidURL(url: string): { errorMessage: string; isValid: boolean } {
  return {
    errorMessage: envErrorMessage('VARIABLE', url, 'is not a valid URL.'),
    isValid: validator.isURL(url) || url.startsWith('http://localhost') // REVISAR
  };
}

// export function isNotEmptyString(value: string): boolean {
//   return '' !== value.trim();
// }

// --------------------------------------------------------------------------------

// class EnvValidationError extends Error {
//   constructor(envName: string, envValue: string, message: string) {
//     super(`[Env_Error] ${envName}: '${envValue}' ${message}`);
//     this.name = 'EnvValidationError';
//   }
// }

type ValidatorFn = (envVariable: string) => { errorMessage: string; isValid: boolean };

type EnvValidationResult = {
  error: string;
  success: boolean;
  // data: { [K in keyof T]: string };
};

class EnvSchema {
  private schema: Record<string, ValidatorFn>;
  private errors: string[];
  // private validatedVariables = {};

  constructor(schema: Record<string, ValidatorFn>) {
    this.schema = schema;
    this.errors = [];
  }

  public validate(env: Record<string, string>): EnvValidationResult {
    for (const [envVariable, validatorFn] of Object.entries(this.schema)) {
      const { errorMessage, isValid } = validatorFn(env[envVariable]);

      if (!isValid) {
        this.errors.push(errorMessage);
      }
    }

    const hasErrors = 0 < this.errors.length;
    if (hasErrors) {
      return {
        error: this.errors.join('\n'),
        success: false
      };
    }
    return { error: null, success: true };
  }
}

const envSchema = new EnvSchema({
  FRONT_END_URL: isValidURL,
  API_ENDPOINT: isValidEndpoint
});

const { error, success } = envSchema.validate(process.env);

if (!success) {
  throw new EnvValidationError(error);
}

// const {
//   // API
//   // API_GATEWAY_PROTOCOL,
//   // API_GATEWAY_HOST,
//   // API_GATEWAY_PORT,
//   // API_GATEWAY_PROTOCOL_SECURE,
//   // API_ENDPOINT,

//   // FRONT_END
//   // FRONT_END_URL

//   // MOBILE
//   // MOBILE_APP,
//   // MOBILE_APP_NAME,
//   // MOBILE_APP_DOWNLOAD_URL,
//   // PLAY_STORE_DOWNLOAD_LINK
//   // IOS_DOWNLOAD_LINK
// } = process.env;

// const { error , isSuccess, data } = validar(process.env);

// if (!isSuccess) {
//   throw [new Error("pepe")];
// }

// if (0 < errors.length) {
//   throw errors;
// }

// --------------------------------------------------------------------------------

// if (!isValidURL(FRONT_END_URL)) {
//   // throw new EnvValidationError('FRONT_END_URL', FRONT_END_URL, 'is not a valid URL.');
//   errors.push(new EnvValidationError('FRONT_END_URL', FRONT_END_URL, 'is not a valid URL.'));
//   // errors.push();
// }

// export { FRONT_END_URL };

// --------------------------------------------------------------------------------

// if (!isNotEmptyString(MOBILE_APP)) {
//   throw new EnvValidationError('MOBILE_APP', MOBILE_APP, 'must not be an empty string.');

// }

// if (!isNotEmptyString(MOBILE_APP_NAME)) {
//   throw new EnvValidationError('MOBILE_APP_NAME', MOBILE_APP_NAME, 'is not a valid URL.');
// }

// if (!isValidURL(MOBILE_APP_DOWNLOAD_URL)) {
//   throw new EnvValidationError('MOBILE_APP_DOWNLOAD_URL', MOBILE_APP_DOWNLOAD_URL, 'is not a valid URL.');
// }

// if (!isValidURL(PLAY_STORE_DOWNLOAD_LINK)) {
//   throw new EnvValidationError('PLAY_STORE_DOWNLOAD_LINK', PLAY_STORE_DOWNLOAD_LINK, 'is not a valid URL.');
// }

// --------------------------------------------------------------------------------

// if (!isValidProtocol(API_GATEWAY_PROTOCOL)) {
//   // throw new EnvValidationError('API_GATEWAY_PROTOCOL', API_GATEWAY_PROTOCOL, 'is not a valid protocol.');
//   errors.push(new EnvValidationError('API_GATEWAY_PROTOCOL', API_GATEWAY_PROTOCOL, 'is not a valid protocol.'));
// }

// if (!isValidHost(API_GATEWAY_HOST)) {
//   // throw new EnvValidationError('API_GATEWAY_HOST', API_GATEWAY_HOST, 'is not a valid host.');
//   errors.push(new EnvValidationError('API_GATEWAY_HOST', API_GATEWAY_HOST, 'is not a valid host.'));
// }

// const success = true;

// if (success) {
//   throw errors;
// }

// if (!isValidPort(API_GATEWAY_PORT)) {
//   throw new EnvValidationError('API_GATEWAY_PORT', API_GATEWAY_PORT, 'is not a valid port.');
// }

// if (!isValidProtocol(API_GATEWAY_PROTOCOL_SECURE)) {
//   throw new EnvValidationError('API_GATEWAY_PROTOCOL_SECURE', API_GATEWAY_PROTOCOL_SECURE, 'is not a valid protocol.');
// }

// if (!isValidEndpoint(API_ENDPOINT)) {
//   throw new EnvValidationError('API_ENDPOINT', API_ENDPOINT, 'is not a valid endpoint.');
// }

// export const API = {
//   GATEWAY_PROTOCOL: API_GATEWAY_PROTOCOL,
//   GATEWAY_HOST: API_GATEWAY_HOST,
//   GATEWAY_PORT: API_GATEWAY_PORT,
//   GATEWAY_PROTOCOL_SECURE: API_GATEWAY_PROTOCOL_SECURE,
//   ENDPOINT: API_ENDPOINT
// };

// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------
