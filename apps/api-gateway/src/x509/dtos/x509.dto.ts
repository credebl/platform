import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SortFields, X509ExtendedKeyUsage, X509KeyUsage, x5cKeyType, x5cRecordStatus } from '@credebl/enum/enum';
import { IX509SearchCriteria } from '@credebl/common/interfaces/x509.interface';
import { toNumber, trim } from '@credebl/common/cast.helper';

export class AuthorityAndSubjectKeyDto {
  @ApiProperty({
    enum: x5cKeyType,
    //default: x5cKeyType.P256.toString(),
    description: 'Type of the key used for signing the X.509 Certificate (default is p256)'
  })
  @IsOptional()
  @IsEnum(x5cKeyType)
  keyType: x5cKeyType = x5cKeyType.P256;
}

export enum GeneralNameType {
  DNS = 'dns',
  DN = 'dn',
  EMAIL = 'email',
  GUID = 'guid',
  IP = 'ip',
  URL = 'url',
  UPN = 'upn',
  REGISTERED_ID = 'id'
}

export class NameDto {
  @ApiProperty({
    example: Object.keys(GeneralNameType),
    enum: GeneralNameType
  })
  @IsNotEmpty()
  @IsEnum(GeneralNameType)
  type: GeneralNameType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  value: string;
}

export class X509CertificateIssuerAndSubjectOptionsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() countryName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stateOrProvinceName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() organizationalUnit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() commonName?: string;
}

class ValidityDto {
  @ApiPropertyOptional() @IsOptional() @IsDate() @Type(() => Date) notBefore?: Date;
  @ApiPropertyOptional() @IsOptional() @IsDate() @Type(() => Date) notAfter?: Date;
}

export class KeyUsageDto {
  @ApiProperty({
    enum: X509KeyUsage,
    isArray: true,
    example: Object.keys(X509KeyUsage)
  })
  @IsArray()
  @IsEnum(X509KeyUsage, { each: true })
  usages: X509KeyUsage[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  markAsCritical?: boolean;
}

export class ExtendedKeyUsageDto {
  @ApiProperty({
    enum: X509ExtendedKeyUsage,
    isArray: true,
    example: Object.keys(X509ExtendedKeyUsage)
  })
  @IsArray()
  @IsEnum(X509ExtendedKeyUsage, { each: true })
  usages: X509ExtendedKeyUsage[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  markAsCritical?: boolean;
}

export class NameListDto {
  @ApiProperty({ type: [NameDto] })
  @ArrayNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => NameDto)
  name: NameDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  markAsCritical?: boolean;
}

export class AuthorityAndSubjectKeyIdentifierDto {
  @ApiPropertyOptional()
  @IsBoolean()
  include: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  markAsCritical?: boolean;
}

export class BasicConstraintsDto {
  @ApiProperty()
  @IsBoolean()
  ca: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  pathLenConstraint?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  markAsCritical?: boolean;
}

export class CrlDistributionPointsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  urls: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  markAsCritical?: boolean;
}

export class X509CertificateExtensionsOptionsDto {
  @ApiPropertyOptional({ type: KeyUsageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => KeyUsageDto)
  keyUsage?: KeyUsageDto;

  @ApiPropertyOptional({ type: ExtendedKeyUsageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtendedKeyUsageDto)
  extendedKeyUsage?: ExtendedKeyUsageDto;

  @ApiPropertyOptional({ type: AuthorityAndSubjectKeyIdentifierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthorityAndSubjectKeyIdentifierDto)
  authorityKeyIdentifier?: AuthorityAndSubjectKeyIdentifierDto;

  @ApiPropertyOptional({ type: AuthorityAndSubjectKeyIdentifierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthorityAndSubjectKeyIdentifierDto)
  subjectKeyIdentifier?: AuthorityAndSubjectKeyIdentifierDto;

  @ApiPropertyOptional({ type: NameListDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NameListDto)
  issuerAlternativeName?: NameListDto;

  @ApiPropertyOptional({ type: NameListDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NameListDto)
  subjectAlternativeName?: NameListDto;

  @ApiPropertyOptional({ type: BasicConstraintsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BasicConstraintsDto)
  basicConstraints?: BasicConstraintsDto;

  @ApiPropertyOptional({ type: CrlDistributionPointsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CrlDistributionPointsDto)
  crlDistributionPoints?: CrlDistributionPointsDto;
}

// Main DTO
//@ApiExtraModels(X509CertificateIssuerAndSubjectOptionsDto)
export class X509CreateCertificateOptionsDto {
  @ApiPropertyOptional({ type: () => AuthorityAndSubjectKeyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthorityAndSubjectKeyDto)
  authorityKey?: AuthorityAndSubjectKeyDto;

  /**
   *
   * The key that is the subject of the X.509 Certificate
   *
   * If the `subjectPublicKey` is not included, the `authorityKey` will be used.
   * This means that the certificate is self-signed
   *
   */
  @ApiPropertyOptional({ type: () => AuthorityAndSubjectKeyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthorityAndSubjectKeyDto)
  subjectPublicKey?: AuthorityAndSubjectKeyDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiProperty({ oneOf: [{ $ref: getSchemaPath(X509CertificateIssuerAndSubjectOptionsDto) }, { type: 'string' }] })
  // @ApiProperty({ type: X509CertificateIssuerAndSubjectOptionsDto })
  @ValidateNested()
  @Type(() => X509CertificateIssuerAndSubjectOptionsDto)
  issuer: X509CertificateIssuerAndSubjectOptionsDto | string;

  @ApiPropertyOptional({
    oneOf: [{ $ref: getSchemaPath(X509CertificateIssuerAndSubjectOptionsDto) }, { type: 'string' }]
  })
  @IsOptional()
  subject?: X509CertificateIssuerAndSubjectOptionsDto | string;

  @ApiPropertyOptional({ type: () => ValidityDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ValidityDto)
  validity?: ValidityDto;

  @ApiPropertyOptional({ type: () => X509CertificateExtensionsOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => X509CertificateExtensionsOptionsDto)
  extensions?: X509CertificateExtensionsOptionsDto;
}

export class X509ImportCertificateOptionsDto {
  @ApiProperty({
    description: 'certificate',
    required: true
  })
  @IsString()
  certificate: string;

  @ApiPropertyOptional({
    description: 'Private key in base64 string format'
  })
  @IsOptional()
  @IsString()
  privateKey?: string;

  @ApiProperty({
    enum: x5cKeyType,
    //default: x5cKeyType.P256.toString(),
    description: 'Type of the key used for signing the X.509 Certificate (default is p256)'
  })
  @IsOptional()
  @IsEnum(x5cKeyType)
  keyType: x5cKeyType = x5cKeyType.P256;
}

export class x509Input {
  @ApiProperty({
    description: 'certificate',
    required: true
  })
  @IsString()
  certificate: string;
}

export class X509CertificateSubjectOptionsDto {
  @ApiProperty() @IsNotEmpty() @IsString() countryName: string;
  // @ApiPropertyOptional() @IsOptional() @IsString() stateOrProvinceName?: string;
  // @ApiPropertyOptional() @IsOptional() @IsString() organizationalUnit?: string;
  @ApiProperty() @IsNotEmpty() @IsString() commonName: string;
}

export class BasicX509CreateCertificateConfig {
  @ApiProperty({ type: () => X509CertificateSubjectOptionsDto, required: true })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => X509CertificateSubjectOptionsDto)
  subject: X509CertificateSubjectOptionsDto;

  @ApiPropertyOptional({ type: () => AuthorityAndSubjectKeyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthorityAndSubjectKeyDto)
  subjectKey?: AuthorityAndSubjectKeyDto;
}

export interface X509GenericRecordContent {
  dcs?: string | string[];
  root?: string;
}

export interface X509GenericRecord {
  id: string;
  content?: X509GenericRecordContent;
}

export class x509OptionsDto {
  @ApiProperty({ example: 'exampleOrg' })
  @IsNotEmpty()
  @IsString()
  commonName: string;

  @ApiProperty({ example: 'IN' })
  @IsNotEmpty()
  @IsString()
  countryName: string;
}

export class X509SearchCriteriaDto implements IX509SearchCriteria {
  @ApiProperty({ required: false, example: '1' })
  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  pageNumber: number = 1;

  @ApiProperty({ required: false, example: '10' })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @Min(1, { message: 'Page size must be greater than 0' })
  @Max(100, { message: 'Page size must be less than 100' })
  pageSize: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @Type(() => String)
  searchByText: string = '';

  @ApiProperty({
    required: false
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortFields)
  sortField: string = SortFields.CREATED_DATE_TIME;

  @ApiProperty({
    required: false,
    enum: x5cKeyType,
    enumName: 'keyType'
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(x5cKeyType)
  keyType: x5cKeyType;

  @ApiProperty({
    required: false,
    enum: x5cRecordStatus,
    enumName: 'status'
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(x5cRecordStatus)
  status: x5cRecordStatus;
}
