import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Oid4vcIssuanceModule } from './../src/oid4vc-issuance.module';

describe('Oid4vcIssuanceController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [Oid4vcIssuanceModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
