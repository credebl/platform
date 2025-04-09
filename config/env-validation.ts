import * as dotenv from 'dotenv';

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

type EnvName = string;

interface ValidationMethod {
  method: (value: string) => { message: string; success: boolean };
  optional?: boolean;
}

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
      const { method, optional = false } = validationMethod;

      // If the value is not defined, add an error message
      if (!value && !optional) {
        errors.push({ key: envName, message: 'Value must be defined.', received: process.env[envName] });
        continue;
      }

      // Validate the value using the schema function
      const { message, success } = method(value);

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
