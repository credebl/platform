/**
 * With this we can override global level validation pipe config using '@RewriteValidationOptions({ whitelist: false })' decorator
 * Here, options can be anything from 'ValidatorOptions'.
 * I've designed this approach from reference from: https://github.com/nestjs/nest/issues/2390#issuecomment-5020%E2%80%8C%E2%80%8B42256
 * (Specifically, from here: https://github.com/nestjs/nest/issues/2390#issuecomment-517623971)
 *
 * This is the best workaround we've found until this issue/feature request is addressed:
 * https://github.com/typestack/class-validator/issues/1486
 *
 * Also the NestJs team doesn't seem to up for taking this issue any time soon, as per the comment here: https://github.com/nestjs/nest/issues/7779
 *
 * Read more about this apprach here: https://gist.github.com/GHkrishna/3b38872ba8c2eb1d299d0a943013de49
 */

import { ArgumentMetadata, Injectable, SetMetadata, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { ValidatorOptions } from 'class-validator';
import { Reflector } from '@nestjs/core';

export const REWRITE_VALIDATION_OPTIONS = 'rewrite_validation_options';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function RewriteValidationOptions(options: ValidatorOptions) {
  return SetMetadata(REWRITE_VALIDATION_OPTIONS, options);
}

@Injectable()
export class UpdatableValidationPipe extends ValidationPipe {
  private readonly defaultValidatorOptions: ValidatorOptions;

  constructor(
    private reflector: Reflector,
    globalOptions: ValidationPipeOptions = {}
  ) {
    super(globalOptions);
    // Store only class-validator relevant options
    this.defaultValidatorOptions = {
      whitelist: globalOptions.whitelist,
      forbidNonWhitelisted: globalOptions.forbidNonWhitelisted,
      skipMissingProperties: globalOptions.skipMissingProperties,
      forbidUnknownValues: globalOptions.forbidUnknownValues
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
  async transform(value: any, metadata: ArgumentMetadata) {
    const overrideOptions = this.reflector.get<ValidatorOptions>(REWRITE_VALIDATION_OPTIONS, metadata.metatype);

    if (overrideOptions) {
      const originalOptions = { ...this.validatorOptions };
      this.validatorOptions = { ...this.defaultValidatorOptions, ...overrideOptions };

      try {
        const result = await super.transform(value, metadata);
        this.validatorOptions = originalOptions;
        return result;
      } catch (err) {
        this.validatorOptions = originalOptions;
        throw err;
      }
    }

    return super.transform(value, metadata);
  }
}
