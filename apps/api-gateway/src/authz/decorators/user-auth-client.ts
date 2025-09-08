import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ClientAliasValidationPipe implements PipeTransform {
  private readonly allowedAliases: string[];

  constructor() {
    this.allowedAliases = (process.env.SUPPORTED_SSO_CLIENTS || '')
      .split(',')
      .map((alias) => alias.trim())
      .filter(Boolean);
  }

  transform(value: string): string {
    if (!value) {
      return value;
    } // allow empty if it's optional
    const upperValue = value.toUpperCase();

    if (!this.allowedAliases.includes(upperValue)) {
      throw new BadRequestException(`Invalid clientAlias. Allowed values are: ${this.allowedAliases.join(', ')}`);
    }

    return upperValue;
  }
}
