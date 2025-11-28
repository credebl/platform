import { X509CertificateRecord } from '@credebl/common/interfaces/x509.interface';
import { x5cKeyType, x5cRecordStatus } from '@credebl/enum/enum';

export interface CreateX509CertificateEntity {
  orgId: string; // We'll accept orgId and find orgAgent internally
  keyType: x5cKeyType;
  status: string;
  validFrom: Date;
  expiry: Date;
  certificateBase64: string;
  createdBy: string;
  lastChangedBy: string;
}

export interface UpdateCertificateStatusDto {
  status: x5cRecordStatus;
  lastChangedBy: string;
}

export interface CertificateDateCheckDto {
  orgId: string;
  validFrom: Date;
  expiry: Date;
  keyType: x5cKeyType;
  status: x5cRecordStatus;
  excludeCertificateId?: string;
}

export interface OrgAgent {
  id: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  orgDid: string;
  verkey: string;
  agentEndPoint: string;
  agentId: string;
  isDidPublic: boolean;
  ledgerId: string;
  orgAgentTypeId: string;
  tenantId: string;
}

export interface IX509ListCount {
  total: number;
  data: X509CertificateRecord[];
}

export interface IX509CollisionResult {
  hasCollision: boolean;
  collisions: X509CertificateRecord[];
}
