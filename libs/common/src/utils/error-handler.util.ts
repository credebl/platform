import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { inspect } from 'util';

/**
 * Error categorization interface for consistent error handling
 */
interface ErrorResponse {
  message: string;
  statusCode: number;
}

/**
 * Centralized error handler utility for microservices
 * Converts any error type to RpcException with appropriate status code
 */
export class ErrorHandler {
  /**
   * Categorize and convert error to RpcException
   * @param error - Any caught error
   * @param defaultMessage - Fallback message if error cannot be parsed
   * @returns RpcException with proper status code
   */
  static handle(error: unknown, defaultMessage: string = 'An unexpected error occurred'): never {
    const errorResponse = ErrorHandler.categorize(error, defaultMessage);
    throw new RpcException(errorResponse);
  }

  /**
   * Categorize error and return formatted response
   * @param error - Any caught error
   * @param defaultMessage - Fallback message
   * @returns Formatted error response with statusCode
   */
  static categorize(error: unknown, defaultMessage: string = 'An unexpected error occurred'): ErrorResponse {
    // Handle RpcException (already formatted)
    if (error instanceof RpcException) {
      return error.getError() as ErrorResponse;
    }

    // Handle HttpException and subclasses (BadRequestException, ConflictException, etc.)
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      const message =
        'string' === typeof response
          ? response
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (response as any).message || 'HTTP Exception';

      return { message, statusCode: status };
    }

    // Handle standard Error
    if (error instanceof Error) {
      const message = error.message || defaultMessage;
      const statusCode = ErrorHandler.getStatusCodeByMessage(message);

      return { message, statusCode };
    }

    // Handle unknown error types (string, object, etc.)
    // Extract message from different error shapes in a clear, explicit way
    let message: string;
    if ('string' === typeof error) {
      message = error;
    } else if ('object' === typeof error && null !== error && 'message' in (error as object)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message = (error as any).message ?? defaultMessage;
    } else {
      message = defaultMessage;
    }

    return { message, statusCode: HttpStatus.INTERNAL_SERVER_ERROR };
  }

  /**
   * Determine HTTP status code based on error message keywords
   * @param message - Error message to analyze
   * @returns Appropriate HTTP status code
   */
  private static getStatusCodeByMessage(message: string): number {
    const lowerMessage = message.toLowerCase();

    // Conflict/Duplicate errors → 409
    if (
      lowerMessage.includes('already exists') ||
      lowerMessage.includes('already assigned') ||
      lowerMessage.includes('duplicate') ||
      lowerMessage.includes('conflict')
    ) {
      return HttpStatus.CONFLICT;
    }

    // Validation/Bad Request errors → 400
    if (
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('required') ||
      lowerMessage.includes('validation') ||
      lowerMessage.includes('bad request')
    ) {
      return HttpStatus.BAD_REQUEST;
    }

    // Not Found errors → 404
    if (lowerMessage.includes('not found') || lowerMessage.includes('does not exist')) {
      return HttpStatus.NOT_FOUND;
    }

    // Unauthorized/Forbidden errors → 401/403
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('not authorized')) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (lowerMessage.includes('forbidden') || lowerMessage.includes('permission denied')) {
      return HttpStatus.FORBIDDEN;
    }

    // Default to 500 Internal Server Error
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Format error object for logging
   * @param error - Error to format
   * @returns Formatted error string
   */
  static format(error: unknown): string {
    if (error instanceof Error) {
      return JSON.stringify({
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    if ('string' === typeof error) {
      return error;
    }

    // Try to stringify safely (handle circular references). If JSON is unhelpful
    // (e.g. empty object or array), fall back to util.inspect for a richer output.
    try {
      const json = JSON.stringify(error, ErrorHandler.getSafeReplacer(), 2);
      if (json && '{}' !== json && '[]' !== json) {
        return json;
      }
      return inspect(error, { depth: null, maxArrayLength: null, compact: false });
    } catch {
      try {
        return inspect(error, { depth: null, maxArrayLength: null, compact: false });
      } catch {
        return String(error);
      }
    }
  }

  // Creates a replacer to safely stringify objects with circular references
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static getSafeReplacer(): any {
    const seen = new WeakSet();
    return (_key: string, value: unknown) => {
      if ('object' === typeof value && null !== value) {
        if (seen.has(value as object)) {
          return '[Circular]';
        }
        seen.add(value as object);
      }
      // Handle bigint which JSON.stringify can't serialize
      if ('bigint' === typeof value) {
        return value.toString();
      }
      return value;
    };
  }
}
