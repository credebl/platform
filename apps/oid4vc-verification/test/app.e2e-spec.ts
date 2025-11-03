import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Oid4vcVerificationModule } from './../src/oid4vc-verification.module';

describe('Oid4vcVerificationController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [Oid4vcVerificationModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => request(app.getHttpServer()).get('/').expect(200).expect('Hello World!'));
});
