import { trimEnvVariables } from './trim-env';

/**
 * Side-effect module: trims `process.env` as soon as it is imported.
 *
 * Import it as the very first statement of a service entry point so that modules evaluated later
 * (e.g. Nest module decorators calling `getNatsOptions`, or the OpenTelemetry tracer reading
 * `IS_ENABLE_OTEL`) see normalised values instead of the raw ones from the container platform.
 */
trimEnvVariables();
