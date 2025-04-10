import { makeSafeParse, SafeParseReturnType } from './core';
import {
  email,
  endpoint,
  _enum,
  host,
  notEmpty,
  number,
  port,
  protocol,
  startsWith,
  url,
  Validator
} from './validators';
import { Issue, VError } from './error';

/* --------------------------------------------------------------------------------
 * StringBuilder: Builder for string validators
 * -------------------------------------------------------------------------------- */

class StringBuilder {
  private validators: Validator<string>[] = [];

  enum(inputs: string[]): this {
    this.validators.push(_enum(inputs));
    return this;
  }

  notEmpty(): this {
    this.validators.push(notEmpty());
    return this;
  }

  number(): this {
    this.validators.push(number());
    return this;
  }

  boolean(): this {
    this.validators.push(number());
    return this;
  }

  url(): this {
    this.validators.push(url());
    return this;
  }

  email(): this {
    this.validators.push(email());
    return this;
  }

  protocol(): this {
    this.validators.push(protocol());
    return this;
  }

  host(): this {
    this.validators.push(host());
    return this;
  }

  port(): this {
    this.validators.push(port());
    return this;
  }

  endpoint(): this {
    this.validators.push(endpoint());
    return this;
  }

  startsWith(input: string): this {
    this.validators.push(startsWith(input));
    return this;
  }

  safeParse(input: string): SafeParseReturnType<string> {
    return makeSafeParse(this.validators).check(input);
  }
}

/* --------------------------------------------------------------------------------
 * ObjectBuilder: Builder for object validators
 * -------------------------------------------------------------------------------- */

type SchemaShape = {
  [key: string]: StringBuilder;
};

type InferShape<T extends SchemaShape> = {
  [K in keyof T]: string;
};

class ObjectBuilder<T extends SchemaShape> {
  private errors: Issue[] = [];

  constructor(private shape: T) {}

  safeParse(value: object): SafeParseReturnType<InferShape<T>> {
    this.errors = Object.entries(this.shape).reduce((issues, [key, validator]) => {
      const parsed = validator.safeParse(value[key]);

      if (!parsed.success) {
        const updatedIssues = parsed.error.errors().map((issue) => ({ path: key, ...issue }));
        issues.push(...updatedIssues);
      }

      return issues;
    }, [] as Issue[]);

    if (this.errors.length) {
      return {
        error: new VError(this.errors),
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
  string: (): StringBuilder => new StringBuilder(),
  createSchema: <T extends SchemaShape>(shape: T): ObjectBuilder<T> => new ObjectBuilder(shape)
};
