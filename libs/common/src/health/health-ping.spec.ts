import { HEALTH_PROBED_SERVICES, HealthPingModule, healthPingPattern } from './health-ping';

describe('health ping', () => {
  it('uses a distinct pattern per service', () => {
    expect(new Set(HEALTH_PROBED_SERVICES.map((s) => healthPingPattern(s).cmd)).size).toBe(
      HEALTH_PROBED_SERVICES.length
    );
  });

  it('registers a controller whose handler answers with the service identity', () => {
    const { controllers } = HealthPingModule.register('user');
    const Controller = controllers[0] as new () => { ping: () => { service: string; instanceId: string } };
    const reply = new Controller().ping();
    expect(reply.service).toBe('user');
    expect(typeof reply.instanceId).toBe('string');
  });
});
