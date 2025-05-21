import { Injectable } from '@nestjs/common'
import { CLS_ID, type ClsService } from 'nestjs-cls'
import type ContextStorageService from './contextStorageService.interface'

@Injectable()
export default class NestjsClsContextStorageService implements ContextStorageService {
  constructor(private readonly cls: ClsService) {}

  public get<T>(key: string): T | undefined {
    return this.cls.get(key)
  }

  public setContextId(id: string): void {
    this.cls.set(CLS_ID, id)
  }

  public getContextId(): string | undefined {
    return this.cls.getId()
  }

  public set<T>(key: string, value: T): void {
    this.cls.set(key, value)
  }
}
