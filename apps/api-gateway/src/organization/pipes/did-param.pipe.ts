import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ResponseMessages } from '@credebl/common/response-messages';

const DID_PATTERN = /^did:[a-z0-9]+:.+$/;

/**
 * Validates the :did path parameter. The DID arrives URL-encoded, Express has already decoded it.
 */
export class DidParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const did = 'string' === typeof value ? value.trim() : '';
    if (!DID_PATTERN.test(did)) {
      throw new BadRequestException(ResponseMessages.organisation.error.invalidDid);
    }
    return did;
  }
}
