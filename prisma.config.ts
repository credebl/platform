import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'libs/prisma-service/prisma/schema.prisma',
  migrations: {
    path: 'libs/prisma-service/prisma/migrations',
    seed: 'ts-node libs/prisma-service/prisma/seed.ts'
  },
  datasource: {
    // direct DB string here (directUrl from old primsa.schema file)
    url: process.env.DATABASE_URL
  }
});
