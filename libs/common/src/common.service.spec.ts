import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { CommonService } from './common.service';

function catchThrow(fn: () => void): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('expected function to throw');
}

function errorWithResponse(message: string, response: unknown): Error {
  return Object.assign(new Error(message), { response });
}

describe('CommonService', () => {
  let service: CommonService;
  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    put: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonService, { provide: HttpService, useValue: mockHttpService }]
    }).compile();

    service = module.get<CommonService>(CommonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('httpPost', () => {
    it('translates an axios 4xx rejection into the mapped HttpException', async () => {
      const axios404 = errorWithResponse('Request failed with status code 404', {
        status: 404,
        data: { message: 'missing' }
      });
      mockHttpService.post.mockReturnValue({ toPromise: () => Promise.reject(axios404) });

      await expect(service.httpPost('http://example.test', {})).rejects.toEqual(
        expect.objectContaining({ status: 404, response: expect.objectContaining({ statusCode: 404 }) })
      );
    });

    it('translates an ECONNREFUSED rejection into a 404 HttpException', async () => {
      const connRefused = new Error('connect ECONNREFUSED 127.0.0.1:8080');
      mockHttpService.post.mockReturnValue({ toPromise: () => Promise.reject(connRefused) });

      await expect(service.httpPost('http://127.0.0.1:8080', {})).rejects.toEqual(
        expect.objectContaining({ status: 404 })
      );
    });
  });

  describe('handleCommonErrors', () => {
    it('maps ECONNREFUSED to a 404 HttpException', () => {
      const captured = catchThrow(() => service.handleCommonErrors(new Error('connect ECONNREFUSED 127.0.0.1:8080')));

      expect(captured).toBeInstanceOf(HttpException);
      expect((captured as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect((captured as HttpException).getResponse()).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'connect ECONNREFUSED 127.0.0.1:8080'
      });
    });

    it('maps ERR_HTTP_INVALID_HEADER_VALUE to a 401 HttpException', () => {
      const err = new Error('axios Error: ERR_HTTP_INVALID_HEADER_VALUE for header name');
      const captured = catchThrow(() => service.handleCommonErrors(err));

      expect(captured).toBeInstanceOf(HttpException);
      expect((captured as HttpException).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect((captured as HttpException).getResponse()).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'UNAUTHORISED ACCESS'
      });
    });

    it('maps a 404 status code in the message to a 404 HttpException', () => {
      const error = errorWithResponse('Request failed with status code 404', {
        status: 404,
        data: { message: 'missing' }
      });
      const captured = catchThrow(() => service.handleCommonErrors(error));

      expect(captured).toBeInstanceOf(HttpException);
      expect((captured as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect((captured as HttpException).getResponse()).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        error: { message: 'missing' }
      });
    });

    it('maps a 400 status code in the message to a 400 HttpException', () => {
      const error = errorWithResponse('Request failed with status code 400', {
        status: 400,
        data: { message: 'bad request' }
      });
      const captured = catchThrow(() => service.handleCommonErrors(error));

      expect(captured).toBeInstanceOf(HttpException);
      expect((captured as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((captured as HttpException).getResponse()).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Request failed with status code 400',
        error: { message: 'bad request' }
      });
    });

    it('maps a 422 status code in the message to a 422 HttpException', () => {
      const error = errorWithResponse('Request failed with status code 422', {
        status: 422,
        data: { message: 'unprocessable' }
      });
      const captured = catchThrow(() => service.handleCommonErrors(error));

      expect(captured).toBeInstanceOf(HttpException);
      expect((captured as HttpException).getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect((captured as HttpException).getResponse()).toEqual({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: { message: 'unprocessable' }
      });
    });

    it('passes through the response status for unknown errors with a response', () => {
      const error = errorWithResponse('upstream blew up', {
        status: 503,
        data: { message: 'unavailable' }
      });
      const captured = catchThrow(() => service.handleCommonErrors(error));

      expect(captured).toBeInstanceOf(HttpException);
      expect((captured as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect((captured as HttpException).getResponse()).toEqual({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'upstream blew up',
        error: { message: 'unavailable' }
      });
    });
  });

  describe('sendError', () => {
    it('throws an HttpException using the error response status', () => {
      const error = errorWithResponse('nope', { status: 400, data: 'bad input' });
      const captured = catchThrow(() => service.sendError(error));

      expect(captured).toBeInstanceOf(HttpException);
      expect((captured as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((captured as HttpException).getResponse()).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'bad input'
      });
    });

    it('falls back to 500 when the error response has no status', () => {
      const error = errorWithResponse('nope', {});
      const captured = catchThrow(() => service.sendError(error));

      expect(captured).toBeInstanceOf(HttpException);
      expect((captured as HttpException).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect((captured as HttpException).getResponse()).toEqual({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'nope'
      });
    });

    it('falls back to 500 when error.response is undefined', () => {
      const error = Object.assign(new Error('network timeout'));

      const captured = catchThrow(() => service.sendError(error));

      expect(captured).toBeInstanceOf(HttpException);
      expect((captured as HttpException).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect((captured as HttpException).getResponse()).toEqual({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'network timeout'
      });
    });

    it('falls back to 500 when passed undefined', () => {
      const captured = catchThrow(() => service.sendError(undefined));

      expect(captured).toBeInstanceOf(HttpException);
      expect((captured as HttpException).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect((captured as HttpException).getResponse()).toEqual({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: undefined
      });
    });
  });

  describe('filterResponse', () => {
    it('returns the payload unchanged when it already has message and success', () => {
      const payload = { message: 'ok', success: true, data: { id: 1 } };

      expect(service.filterResponse({ data: payload })).toEqual(payload);
    });

    it('wraps a bare payload with results in a formatted response', () => {
      const results = { results: [1, 2, 3] };

      expect(service.filterResponse({ data: results })).toEqual({
        message: 'fetched',
        success: true,
        data: results
      });
    });

    it('unwraps a payload carrying only result', () => {
      expect(service.filterResponse({ data: { result: 'single' } })).toEqual({
        message: 'fetched',
        success: true,
        data: 'single'
      });
    });

    it('passes through plain data without results or result', () => {
      const plain = { foo: 'bar' };

      expect(service.filterResponse({ data: plain })).toEqual({
        message: 'fetched',
        success: true,
        data: plain
      });
    });
  });
});
