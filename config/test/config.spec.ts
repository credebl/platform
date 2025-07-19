import { v } from '../core';

import * as dotenv from 'dotenv';
dotenv.config({
  path: './config/test/.env.test.sample'
});

// --- PROTOCOL ---

test('Protocol Error', () => {
  const mockSchema = v.schema({
    PROTOCOL_TEST_1: v.str().protocol()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Protocol Success http', () => {
  const mockSchema = v.schema({
    PROTOCOL_TEST_2: v.str().protocol()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('Protocol Success https', () => {
  const mockSchema = v.schema({
    PROTOCOL_TEST_3: v.str().protocol()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- HOST ---

test('Host Success', () => {
  const mockSchema = v.schema({
    TEST_HOST_4: v.str().host()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('Host Error exceeds value of valid IP', () => {
  const mockSchema = v.schema({
    TEST_HOST_1: v.str().host()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Host Error contains letters', () => {
  const mockSchema = v.schema({
    TEST_HOST_2: v.str().host()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Host Error invalid format', () => {
  const mockSchema = v.schema({
    TEST_HOST_3: v.str().host()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

// --- LOCALHOST ---

test('LOCALHOST error, doesnt have port number.', () => {
  const mockSchema = v.schema({
    TEST_LOCALHOST_1: v.str().localhost()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('LOCALHOST success, doesnt have protocol.', () => {
  const mockSchema = v.schema({
    TEST_LOCALHOST_2: v.str().localhost()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('LOCALHOST success, with protocol.', () => {
  const mockSchema = v.schema({
    TEST_LOCALHOST_3: v.str().localhost()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('LOCALHOST success, with IPv6 localhost.', () => {
  const mockSchema = v.schema({
    TEST_LOCALHOST_4: v.str().localhost()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- URL ---

test('URL Error invalid protocol', () => {
  const mockSchema = v.schema({
    TEST_URL_1: v.str().url()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('URL Success', () => {
  const mockSchema = v.schema({
    TEST_URL_2: v.str().url()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('URL Success with Localhost', () => {
  const mockSchema = v.schema({
    TEST_URL_3: v.str().url()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('URL Error invalid format', () => {
  const mockSchema = v.schema({
    TEST_URL_4: v.str().url()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('URL Success without protocol', () => {
  const mockSchema = v.schema({
    TEST_URL_5: v.str().url()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- MULTIPLE URL ---

test('Multiple URL error with no valid URL', () => {
  const mockSchema = v.schema({
    TEST_MULTIPLE_URL_1: v.str().multipleUrl()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Multiple URL error with valid URLs, but one not valid', () => {
  const mockSchema = v.schema({
    TEST_MULTIPLE_URL_2: v.str().multipleUrl()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Multiple URL with one URL', () => {
  const mockSchema = v.schema({
    TEST_MULTIPLE_URL_3: v.str().multipleUrl()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('Multiple URL with more than one URL', () => {
  const mockSchema = v.schema({
    TEST_MULTIPLE_URL_4: v.str().multipleUrl()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- PORT ---

test('Port error with well-known port', () => {
  const mockSchema = v.schema({
    TEST_PORT_1: v.str().port()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Port error with out-of-range port', () => {
  const mockSchema = v.schema({
    TEST_PORT_2: v.str().port()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

// --- ENDPOINT ---

test('Endpoint error, not an endpoint', () => {
  const mockSchema = v.schema({
    TEST_ENDPOINT_1: v.str().endpoint()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Endpoint error, wrong format (has protocol)', () => {
  const mockSchema = v.schema({
    TEST_ENDPOINT_2: v.str().endpoint()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Endpoint success with valid endpoint', () => {
  const mockSchema = v.schema({
    TEST_ENDPOINT_3: v.str().endpoint()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- OPTIONAL ---

test('Optional success with no value', () => {
  const mockSchema = v.schema({
    TEST_OPTIONAL_1: v.str().optional()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('Optional success with value', () => {
  const mockSchema = v.schema({
    TEST_OPTIONAL_2: v.str().optional()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// Optional testing for validation chaining, using boolean as an example

test('Optional failure with boolean checking a not valid boolean', () => {
  const mockSchema = v.schema({
    TEST_OPTIONAL_3: v.str().boolean().optional()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Optional success with boolean checking an empty value', () => {
  const mockSchema = v.schema({
    TEST_OPTIONAL_4: v.str().boolean().optional()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('Optional success with boolean checking a valid boolean', () => {
  const mockSchema = v.schema({
    TEST_OPTIONAL_5: v.str().boolean().optional()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- NOT EMPTY ---

test('Not empty failure with no value', () => {
  const mockSchema = v.schema({
    TEST_NOT_EMPTY_1: v.str().notEmpty()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Not empty success with value', () => {
  const mockSchema = v.schema({
    TEST_NOT_EMPTY_2: v.str().notEmpty()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('Not empty failure with boolean checking an empty value', () => {
  const mockSchema = v.schema({
    TEST_NOT_EMPTY_3: v.str().notEmpty().boolean()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Not empty success with boolean checking an existing value', () => {
  const mockSchema = v.schema({
    TEST_NOT_EMPTY_4: v.str().notEmpty().boolean()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- EMAIL ---

test('Email error with invalid mail format', () => {
  const mockSchema = v.schema({
    TEST_EMAIL_1: v.str().email()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Email error with invalid mail format (lacks ".something")', () => {
  const mockSchema = v.schema({
    TEST_EMAIL_2: v.str().email()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Email error with invalid mail format (lacks "@")', () => {
  const mockSchema = v.schema({
    TEST_EMAIL_3: v.str().email()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Email success with valid email', () => {
  const mockSchema = v.schema({
    TEST_EMAIL_4: v.str().email()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- BOOLEAN ---

test('Boolean failure, is not true or false.', () => {
  const mockSchema = v.schema({
    TEST_BOOLEAN_1: v.str().boolean()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Boolean failure, is not true or false.', () => {
  const mockSchema = v.schema({
    TEST_BOOLEAN_2: v.str().boolean()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Boolean error, is uppercase true.', () => {
  const mockSchema = v.schema({
    TEST_BOOLEAN_3: v.str().boolean()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Boolean error, is uppercase false.', () => {
  const mockSchema = v.schema({
    TEST_BOOLEAN_4: v.str().boolean()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Boolean success, is true.', () => {
  const mockSchema = v.schema({
    TEST_BOOLEAN_5: v.str().boolean()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('Boolean success, is false.', () => {
  const mockSchema = v.schema({
    TEST_BOOLEAN_6: v.str().boolean()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- NUMBER ---

test('Number error, is not a valid number.', () => {
  const mockSchema = v.schema({
    TEST_NUMBER_1: v.str().number()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Number success, is a valid number.', () => {
  const mockSchema = v.schema({
    TEST_NUMBER_2: v.str().number()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('Number error, empty string is not a number', () => {
  const mockSchema = v.schema({
    TEST_NUMBER_3: v.str().number()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

// --- POSTGRESURL ---

test('POSTGRESURL error, doesnt start with postgresql://', () => {
  const mockSchema = v.schema({
    TEST_POSTGRES_URL_1: v.str().postgresUrl()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('POSTGRESURL error, wrong format, doesnt contain @', () => {
  const mockSchema = v.schema({
    TEST_POSTGRES_URL_2: v.str().postgresUrl()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('POSTGRESURL error, invalid host.', () => {
  const mockSchema = v.schema({
    TEST_POSTGRES_URL_3: v.str().postgresUrl()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('POSTGRESURL success, valid postgres url', () => {
  const mockSchema = v.schema({
    TEST_POSTGRES_URL_4: v.str().postgresUrl()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- STARTS WITH ---

test('Startswith error, doesnt starts with given value', () => {
  const mockSchema = v.schema({
    TEST_START_WITH_1: v.str().startsWith('AVALUE')
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Startswith success, starts with given value', () => {
  const mockSchema = v.schema({
    TEST_START_WITH_2: v.str().startsWith('WORLD')
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

// --- PATH ---

test('Path success, is valid path to a folder', () => {
  const mockSchema = v.schema({
    TEST_PATH_1: v.str().path()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});

test('Path failure, is empty string', () => {
  const mockSchema = v.schema({
    TEST_PATH_2: v.str().path()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Path failure, doesnt start with /', () => {
  const mockSchema = v.schema({
    TEST_PATH_3: v.str().path()
  });

  expect(mockSchema.safeParse(process.env).success).toBeFalsy();
});

test('Path success, valid path to a file', () => {
  const mockSchema = v.schema({
    TEST_PATH_4: v.str().path()
  });

  expect(mockSchema.safeParse(process.env).success).toBeTruthy();
});
