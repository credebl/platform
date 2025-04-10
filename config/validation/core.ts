import { Issue, VError } from './error';
import { Validator } from './validators';

// ----------

export type SafeParseReturnType<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: VError };

type CheckTypeFn<T> = {
  check(input: T): SafeParseReturnType<T>;
};

// ----------

export function makeSafeParse<T>(validators: Validator<T>[]): CheckTypeFn<T> {
  return {
    check(input: T): SafeParseReturnType<T> {
      const issues: Issue[] = [];

      for (const validator of validators) {
        const issue = validator(input);
        if (issue) {
          issues.push(issue);
        }
      }

      if (0 < issues.length) {
        return { error: new VError(issues), success: false, data: null };
      }

      return { data: input, success: true, error: null };
    }
  };
}
