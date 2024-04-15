import { ValidationArguments, ValidationOptions, registerDecorator } from "class-validator";

interface ToNumberOptions {
    default?: number;
    min?: number;
    max?: number;
}

export function toLowerCase(value: string): string {
    return value.toLowerCase();
}

export function trim(value: string): string {
    if ('string' === typeof value) { return value.trim(); }
}

export function toDate(value: string): Date {
    return new Date(value);
}

export function toBoolean(value: string): boolean {
    // eslint-disable-next-line no-param-reassign
    value = value.toLowerCase();

    // return 'true' === value || '1' === value ? true : false;

    return Boolean('true' === value || '1' === value);

}

export function toNumber(value: string, opts: ToNumberOptions = {}): number {
    let newValue: number = Number.parseInt(value || String(opts.default), 10);

    if (Number.isNaN(newValue)) {
        newValue = opts.default;
    }

    if (opts.min) {
        if (newValue < opts.min) {
            newValue = opts.min;
        }

        if (newValue > opts.max) {
            newValue = opts.max;
        }
    }

    return newValue;
}

export function ledgerName(value: string): string {
   let network;
    network = value.replace(":", " ");
    network = network.charAt(0).toUpperCase() + network.slice(1);
    const words = network.split(" ");
    network = `${words[0]} ${words[1].charAt(0).toUpperCase()}${words[1].slice(1)}`;

    return network;

}

export function isSafeString(value: string): boolean {
    // Define a regular expression to allow alphanumeric characters, spaces, and some special characters
    const safeRegex = /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
  
    // Check if the value matches the safe regex
    return safeRegex.test(value);
  }

  export const IsNotSQLInjection = (validationOptions?: ValidationOptions): PropertyDecorator => (object: object, propertyName: string) => {
      registerDecorator({
        name: 'isNotSQLInjection',
        target: object.constructor,
        propertyName,
        options: validationOptions,
        validator: {
          validate(value) {
            // Check if the value contains any common SQL injection keywords
            const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'WHERE', 'AND', 'OR'];
            for (const keyword of sqlKeywords) {
              if (value.includes(keyword)) {
                return false; // Value contains a SQL injection keyword
              }
            }
            return true; // Value does not contain any SQL injection keywords
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} contains SQL injection keywords.`;
          }
        }
      });
    };
