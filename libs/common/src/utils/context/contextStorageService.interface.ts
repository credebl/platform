export const ContextStorageServiceKey = Symbol();

export interface ContextStorageService {
  setContextId(contextId: string): void;
  getContextId(): string;
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
}
