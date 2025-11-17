import { DidMethod, JSONSchemaType, ledgerLessDIDType, ProofType, schemaRequestType, TemplateIdentifier } from '@credebl/enum/enum';
import { ISchemaFields } from './interfaces/schema.interface';
import { BadRequestException, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isBase64,
  isMimeType,
  registerDecorator
} from 'class-validator';
import { ResponseMessages } from './response-messages';
import { ICredentialData, IJsonldCredential, IPrettyVc } from './interfaces/issuance.interface';

interface ToNumberOptions {
  default?: number;
  min?: number;
  max?: number;
}

export function toLowerCase(value: string): string {
  return value.toLowerCase();
}

export function trim(value: string): string {
  if ('string' === typeof value) {
    return value.trim();
  }
}

export function toDate(value: string): Date {
  return new Date(value);
}

export function toBoolean(value: string): boolean {
  // eslint-disable-next-line no-param-reassign
  value = value.toLowerCase();

  // return 'true' === value || '1' === value ? true : false;

  return Boolean('true' === value || '1' === value);
}

export function toNumber(value: string, opts: ToNumberOptions = {}): number {
  let newValue: number = Number.parseInt(value || String(opts.default), 10);

  if (Number.isNaN(newValue)) {
    newValue = opts.default;
  }

  if (opts.min) {
    if (newValue < opts.min) {
      newValue = opts.min;
    }

    if (newValue > opts.max) {
      newValue = opts.max;
    }
  }

  return newValue;
}

export function ledgerName(value: string): string {
  let network;
  network = value.replace(':', ' ');
  network = network.charAt(0).toUpperCase() + network.slice(1);
  const words = network.split(' ');
  network = `${words[0]} ${words[1].charAt(0).toUpperCase()}${words[1].slice(1)}`;

  return network;
}

export function isSafeString(value: string): boolean {
  // Define a regular expression to allow alphanumeric characters, spaces, and some special characters
  const safeRegex = /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;

  // Check if the value matches the safe regex
  return safeRegex.test(value);
}

export const IsNotSQLInjection =
  (validationOptions?: ValidationOptions): PropertyDecorator => (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isNotSQLInjection',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value) {
          // Check if the value contains any common SQL injection keywords
          const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'WHERE', 'AND', 'OR'];
        if ('string' === typeof value) {
          // Convert the value to upper case for case-insensitive comparison
          const upperCaseValue = value.toUpperCase();
          // Use a regular expression to check for whole words
          for (const keyword of sqlKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(upperCaseValue)) {
              return false; // Value contains a SQL injection keyword
            }
          }
        }
        return true; // Value does not contain any SQL injection keywords
      },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contains SQL injection keywords.`;
        }
      }
    });
  };

@ValidatorConstraint({ name: 'customText', async: false })
export class ImageBase64Validator implements ValidatorConstraintInterface {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unused-vars
  validate(value: string, args: ValidationArguments) {
    // Implement your custom validation logic here
    // Validation to allow option param logo
    if ('' == value) {
      return true;
    }
    if (!value || 'string' !== typeof value) {
      throw new BadRequestException('Invalid base64 string');
    }
    const parts = value.split(',');
    if (2 !== parts.length) {
      throw new BadRequestException('Invalid data URI');
    }
    // eslint-disable-next-line prefer-destructuring
    const mimeType = parts[0].split(';')[0].split(':')[1];
    // eslint-disable-next-line prefer-destructuring
    const base64Data = parts[1];

    // Validate MIME type
    if (!isMimeType(mimeType)) {
      throw new BadRequestException('Please provide valid MIME type');
    }
    // Validate base64 data
    if (!isBase64(base64Data) || '' == base64Data || null == base64Data) {
      throw new BadRequestException('Invalid base64 string');
    }
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments) {
    return 'Default message received from [ImageBase64Validator]';
  }
}

export class TrimStringParamPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
  transform(value: string) {
    return plainToClass(String, value.trim());
  }
}

// export const IsNotUUID = (validationOptions?: ValidationOptions): PropertyDecorator => (object: object, propertyName: string) => {
//   registerDecorator({
//     name: 'isNotUUID',
//     target: object.constructor,
//     propertyName,
//     options: validationOptions,
//     validator: {
//       validate(value) {
//         return !isUUID(value);
//       }
//     }
//   });
// };


export function validateSchemaPayload(schemaPayload: ISchemaFields, schemaType: string): void {
  const errors: string[] = [];

  switch (true) {
    case schemaRequestType.INDY === schemaType:
      switch (true) {
        case !schemaPayload?.name:
          errors.push('name is required for indy schema type');
          break;
        case 'string' !== typeof schemaPayload?.name:
          errors.push('name must be string');
          break;
        case !schemaPayload?.version:
          errors.push('version is required for indy schema type');
          break;
        default:
          break;
      }
      if (!Array.isArray(schemaPayload?.attributes) || 0 === schemaPayload?.attributes.length) {
        errors.push('attributes array must not be empty for indy schema type');
      } else {
        schemaPayload?.attributes.forEach((attribute, index) => {
          if (!attribute) {
            errors.push(`attributes are required at position ${index + 1} in indy schema type`);
          } else {
            switch (true) {
              case !attribute?.displayName:
                errors.push(`displayName is required at position ${index + 1} in indy schema type`);
                break;
              case !attribute?.attributeName:
                errors.push(`attributeName is required at position ${index + 1} in indy schema type`);
                break;
              case !attribute?.schemaDataType:
                errors.push(`schemaDataType is required at position ${index + 1} in indy schema type`);
                break;
              default:
                break;
            }
          }
        });
      }
      break;

    case schemaRequestType.W3C === schemaType:
      switch (true) {
        case !schemaPayload?.schemaName:
          errors.push('schemaName is required for w3c schema type');
          break;
        case 'string' !== typeof schemaPayload?.schemaName:
          errors.push('schemaName must be string');
          break;

        case !schemaPayload?.did:
          errors.push('did is required for w3c schema type');
          break;
        case 'string' !== typeof schemaPayload?.did:
          errors.push('did must be string');
          break;

        case !schemaPayload?.description:
          errors.push('description is required for w3c schema type');
          break;
        case 'string' !== typeof schemaPayload?.description:
          errors.push('description must be string');
          break;
        default:
          break;
      }
      if (!Array.isArray(schemaPayload.schemaAttributes) || 0 === schemaPayload.schemaAttributes.length) {
        errors.push('schemaAttributes array must not be empty for w3c schema type');
      } else {
        schemaPayload.schemaAttributes.forEach((attribute, index) => {
          if (!attribute) {
            errors.push(`schemaAttributes are required at position ${index + 1} in w3c schema type`);
          } else {
            switch (true) {
              case !attribute.title:
                errors.push(`title is required at position ${index + 1} in w3c schema type`);
                break;
              case !attribute.type:
                errors.push(`type is required at position ${index + 1} in w3c schema type`);
                break;
              default:
                break;
            }
          }
        });
      }
      break;

    default:
      break;
  }

  if (0 < errors.length) {
    throw new BadRequestException(errors);
  }
}

export class AgentSpinupValidator {
  private static validateField(value: string, errorMessage: string): void {
    if (!value) {
      throw new BadRequestException(errorMessage);
    }
  }

  private static validateWalletName(walletName: string): void {
    const regex = /^[a-zA-Z0-9]+$/;
    if (!regex.test(walletName)) {
      throw new BadRequestException(ResponseMessages.agent.error.seedChar, {
        cause: new Error(),
        description: 'Please enter a valid wallet name. Only alphanumeric characters are allowed.'
      });
    }
  }

  public static validate(agentSpinupDto): void {
    this.validateWalletName(agentSpinupDto.walletName);
  }

}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email);
};


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
export const createOobJsonldIssuancePayload = (JsonldCredentialDetails: IJsonldCredential, prettyVc: IPrettyVc) => {
  const {credentialData, orgDid, orgId, schemaLedgerId, schemaName, isReuseConnection} = JsonldCredentialDetails;
  const credentialSubject = { };

  const proofType = (orgDid?.includes(DidMethod.POLYGON)) ? ProofType.POLYGON_PROOFTYPE : ProofType.NO_LEDGER_PROOFTYPE;

  for (const key in credentialData) {
    if (credentialData.hasOwnProperty(key) && TemplateIdentifier.EMAIL_COLUMN !== key) {
      credentialSubject[key] = credentialData[key];
    }
  }

  return {
    credentialOffer: [
      {
        'emailId': `${credentialData.email_identifier}`,
        'credential': {
          '@context': ['https://www.w3.org/2018/credentials/v1', `${schemaLedgerId}`],
          'type': [
            'VerifiableCredential',
            `${schemaName}`
          ],
          'issuer': {
            'id': `${orgDid}`
          },
          'issuanceDate': new Date().toISOString(),
          credentialSubject,
          prettyVc
        },
        'options': {
          proofType,
          'proofPurpose': 'assertionMethod'
        }
      }
    ],
    'comment': 'string',
    'protocolVersion': 'v2',
    'credentialType': 'jsonld',
    orgId,
    isReuseConnection
  };
};


@ValidatorConstraint({ name: 'isHostPortOrDomain', async: false })
export class IsHostPortOrDomainConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    // Regular expression for validating URL with host:port or domain
    const hostPortRegex = /^(http:\/\/|https:\/\/)?(?:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)):(?:\d{1,5})(\/[^\s]*)?$/;
    const domainRegex = /^(http:\/\/|https:\/\/)?(?:localhost|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(:\d{1,5})?(\/[^\s]*)?$/;

    return hostPortRegex.test(value) || domainRegex.test(value);
  }

  defaultMessage(): string {
    return 'Invalid host:port or domain format';
  }
}

export function IsHostPortOrDomain(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsHostPortOrDomainConstraint
    });
  };
}

export function checkDidLedgerAndNetwork(schemaType: string, did: string): boolean {

  const cleanSchemaType = schemaType.trim().toLowerCase();
  const cleanDid = did.trim().toLowerCase();
  
  if (JSONSchemaType.POLYGON_W3C === cleanSchemaType) {
    return cleanDid.includes(JSONSchemaType.POLYGON_W3C);
  }

  if (JSONSchemaType.ETHEREUM_W3C === cleanSchemaType) {
    return cleanDid.includes(JSONSchemaType.ETHEREUM_W3C);
  }
  
  if (JSONSchemaType.LEDGER_LESS === cleanSchemaType) {
    return cleanDid.startsWith(ledgerLessDIDType.DID_KEY) || cleanDid.startsWith(ledgerLessDIDType.DID_WEB);
  }

  return false;
}

export function validateAndUpdateIssuanceDates(data: ICredentialData[]): ICredentialData[] {
  // Get current date in 'YYYY-MM-DD' format
  // eslint-disable-next-line prefer-destructuring
  const currentDate = new Date().toISOString().split('T')[0];

  return data.map((item) => {
    const { issuanceDate } = item.credential;
    // eslint-disable-next-line prefer-destructuring
    const issuanceDateOnly = issuanceDate.split('T')[0];

    // If the date does not match the current date, then update it
    if (issuanceDateOnly !== currentDate) {
      item.credential.issuanceDate = new Date().toISOString();
    }

    return item;
  });
}
