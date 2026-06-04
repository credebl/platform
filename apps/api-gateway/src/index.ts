// Public API of @credebl/api-gateway
// Consumers import from here to extend or embed the platform.

export * from './boostrap';
export * from './app.module';

// Feature modules (for per-module overrides)
export { AgentModule as AgentServiceModule } from './agent-service/agent-service.module';
export { AgentModule } from './agent/agent.module';
export * from './authz/authz.module';
export * from './cloud-wallet/cloud-wallet.module';
export * from './connection/connection.module';
export * from './credential-definition/credential-definition.module';
export * from './ecosystem/ecosystem.module';
export * from './fido/fido.module';
export * from './geo-location/geo-location.module';
export * from './issuance/issuance.module';
export * from './notification/notification.module';
export * from './oid4vc-issuance/oid4vc-issuance.module';
export * from './oid4vc-verification/oid4vc-verification.module';
export * from './organization/organization.module';
export * from './platform/platform.module';
export * from './revocation/revocation.module';
export * from './schema/schema.module';
export * from './user/user.module';
export * from './utilities/utilities.module';
export * from './verification/verification.module';
export * from './webhook/webhook.module';
export * from './x509/x509.module';
