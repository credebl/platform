type Primitive = string | number | null | undefined;

export type Issue = {
  path?: string;
  expected?: Primitive;
  received?: Primitive;
  message: string;
};

type FlattenedIssue = {
  [key: string]: { expected?: Primitive; received?: Primitive; message: string }[];
};

// ----------

export class VError extends Error {
  private issues: Issue[];

  constructor(errors: Issue[]) {
    const message = JSON.stringify(errors, null, 2);

    super(message);
    this.issues = errors;
    this.name = 'VError';
  }

  public errors(): Issue[] {
    return this.issues;
  }

  public flatten(): FlattenedIssue {
    return this.errors().reduce((flattened, error) => {
      const key = error.path || 'messages';

      if (!flattened[key]) {
        flattened[key] = [];
      }

      flattened[key].push({
        expected: error.expected,
        received: error.received,
        message: error.message
      });

      return flattened;
    }, {} as FlattenedIssue);
  }
}
