export interface ResourceAccess {
  roles: string[];
}

export interface EcosystemRole {
  lead?: string[];
  member?: string[];
}

export interface EcosystemAccess {
  ecosystem_role: EcosystemRole;
}

export interface JwtPayload {
  iss: string;
  sub: string;
  aud: string[];
  iat?: number;
  exp?: number;
  azp: string;
  scope: string;
  gty?: string;
  permissions: string[];
  email?: string;
  sid: string;

  resource_access?: Record<string, ResourceAccess>;
  ecosystem_access?: Record<string, EcosystemAccess>;
}
