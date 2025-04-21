import { v } from '../core';

import * as dotenv from 'dotenv';
dotenv.config({
  path: './config/test/.env'
});

test('Protocol Success', () => {
  const mockSchema = v.schema({
    API_GATEWAY_PROTOCOL: v.str().protocol()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('Protocol Error', () => {
  const mockSchema = v.schema({
    API_GATEWAY_PROTOCOL_SECURE: v.str().protocol()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});
