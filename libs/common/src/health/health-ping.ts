import { Controller, DynamicModule, Module } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { hostname } from 'node:os';
import { CommonConstants } from '../common.constant';

/** Microservices that answer the NATS health ping, in the order the status page lists them. */
export const HEALTH_PROBED_SERVICES: string[] = (
  [
    CommonConstants.AGENT_PROVISIONING,
    CommonConstants.AGENT_SERVICE,
    CommonConstants.CLOUD_WALLET_SERVICE,
    CommonConstants.CONNECTION_SERVICE,
    CommonConstants.ECOSYSTEM_SERVICE,
    CommonConstants.GEO_LOCATION_SERVICE,
    CommonConstants.ISSUANCE_SERVICE,
    CommonConstants.LEDGER_SERVICE,
    CommonConstants.NOTIFICATION_SERVICE,
    CommonConstants.OIDC4VC_ISSUANCE_SERVICE,
    CommonConstants.OIDC4VC_VERIFICATION_SERVICE,
    CommonConstants.ORGANIZATION_SERVICE,
    CommonConstants.USER_SERVICE,
    CommonConstants.UTILITY_SERVICE,
    CommonConstants.VERIFICATION_SERVICE,
    CommonConstants.WEBHOOK_SERVICE,
    CommonConstants.X509_SERVICE
  ] as unknown[]
).map(String);

export interface IHealthPingResponse {
  service: string;
  instanceId: string;
  uptimeSeconds: number;
}

/** One subject per service: a shared pattern would be answered by every service's queue group. */
export const healthPingPattern = (service: string): { cmd: string } => ({ cmd: `health-check-${service}` });

/**
 * Registers a NATS message handler that answers the gateway's health ping. It goes through the
 * service's own microservice message loop, so a reply proves the service is subscribed and handling
 * messages (dependency checks stay with the HTTP /health/ready probe).
 * Usage: add `HealthPingModule.register(CommonConstants.USER_SERVICE)` to the module's `imports`.
 */
@Module({})
export class HealthPingModule {
  static register(serviceName: string | CommonConstants): DynamicModule {
    const service = String(serviceName);
    @Controller()
    class HealthPingController {
      @MessagePattern(healthPingPattern(service))
      ping(): IHealthPingResponse {
        return { service, instanceId: hostname(), uptimeSeconds: Math.floor(process.uptime()) };
      }
    }

    return { module: HealthPingModule, controllers: [HealthPingController] };
  }
}
