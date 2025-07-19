import {
  path,
  domain,
  email,
  endpoint,
  localhost,
  host,
  notEmpty,
  optional,
  number,
  boolean,
  port,
  protocol,
  startsWith,
  url,
  multipleUrl,
  postgresUrl,
  Validator
} from './validators';
import { Issue, VError } from './error';

/* --------------------------------------------------------------------------------
 * StringBuilder: Builder for string validators
 * -------------------------------------------------------------------------------- */

export type SafeParseReturnType<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: VError };

class StringBuilder {
  readonly #validators: Validator<string>[] = [];

  /**
   * Adds a validator that checks if the string is not empty.
   *
   * This validator will fail if the string is `undefined`, `null`, or an empty string.
   *
   * This validator is meant to be used when there are no other validations being used, since all other validations have null/undefined/"" checks in them.
   */
  notEmpty(): this {
    this.#validators.push(notEmpty());
    return this;
  }

  number(): this {
    this.#validators.push(number());
    return this;
  }

  boolean(): this {
    this.#validators.push(boolean());
    return this;
  }

  url(): this {
    this.#validators.push(url());
    return this;
  }

  multipleUrl(): this {
    this.#validators.push(multipleUrl());
    return this;
  }

  postgresUrl(): this {
    this.#validators.push(postgresUrl());
    return this;
  }

  email(): this {
    this.#validators.push(email());
    return this;
  }

  protocol(): this {
    this.#validators.push(protocol());
    return this;
  }

  host(): this {
    this.#validators.push(host());
    return this;
  }

  localhost(): this {
    this.#validators.push(localhost());
    return this;
  }

  port(): this {
    this.#validators.push(port());
    return this;
  }

  endpoint(): this {
    this.#validators.push(endpoint());
    return this;
  }

  startsWith(input: string): this {
    this.#validators.push(startsWith(input));
    return this;
  }

  domain(): this {
    this.#validators.push(domain());
    return this;
  }

  path(): this {
    this.#validators.push(path());
    return this;
  }

  /**
   * Adds a validator that allows the string to be optional.
   *
   * This validator prevent failure if the string is undefined.
   *
   * This is useful when you want to validate something that you know it can or can't be there,
   * adding other validators on top to validate when there actually is something.
   */
  optional(): this {
    this.#validators.push(optional());
    return this;
  }

  safeParse(input: string): SafeParseReturnType<string> {
    const issues: Issue[] = [];

    if (input === undefined && this.#validators.includes(optional())) {
      return { data: input, error: null, success: true };
    }

    for (const validator of this.#validators) {
      const issue = validator(input);
      if (issue) {
        issues.push(issue);
      }
    }

    if (0 < issues.length) {
      return { data: null, error: new VError(issues), success: false };
    }

    return { data: input, error: null, success: true };
  }
}

/* --------------------------------------------------------------------------------
 * ObjectBuilder: Builder for object validators
 * -------------------------------------------------------------------------------- */

export type SchemaShape = {
  [key: string]: StringBuilder;
};

export type InferShape<T extends SchemaShape> = {
  [K in keyof T]: string;
};

export class ObjectBuilder<T extends SchemaShape> {
  #errors: Issue[] = [];

  constructor(private readonly shape: T) {}

  safeParse(value: object): SafeParseReturnType<InferShape<T>> {
    this.#errors = Object.entries(this.shape).reduce((issues, [key, validator]) => {
      const parsed = validator.safeParse((value as Record<string, string>)[key]);

      if (!parsed.success) {
        const updatedIssues = parsed.error.errors().map((issue) => ({ path: key, ...issue }));
        issues.push(...updatedIssues);
      }

      return issues;
    }, [] as Issue[]);

    if (this.#errors.length) {
      return {
        error: new VError(this.#errors),
        success: false,
        data: null
      };
    }

    return {
      data: value as InferShape<T>,
      success: true,
      error: null
    };
  }
}

/* --------------------------------------------------------------------------------
 * v: Public API for creating validators
 * -------------------------------------------------------------------------------- */

export const v = {
  str: (): StringBuilder => new StringBuilder(),
  schema: <T extends SchemaShape>(shape: T): ObjectBuilder<T> => new ObjectBuilder(shape)
};
