import { Injectable } from '@nestjs/common';

@Injectable()
export class EcosystemService {
  getHello(): string {
    return 'Hello World!';
  }
}
