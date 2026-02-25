import { promises as dns } from 'dns';
import { Logger } from '@nestjs/common';

const { lookup } = dns;
const logger = new Logger('UrlValidator');

function isPrivateIp(ip: string): boolean {
  // IPv4-mapped IPv6: ::ffff:x.x.x.x
  const ipv4MappedMatch = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (ipv4MappedMatch) {
    return isPrivateIp(ipv4MappedMatch[1]);
  }

  // IPv4 checks
  // 0.0.0.0/8 (Unspecified/This-Network)
  if (/^0\./.test(ip)) {
    return true;
  }

  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (/^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./.test(ip)) {
    return true;
  }

  // 127.0.0.0/8 (Loopback)
  if (/^127\./.test(ip)) {
    return true;
  }

  // 10.0.0.0/8 (Private)
  if (/^10\./.test(ip)) {
    return true;
  }

  // 172.16.0.0/12 (Private)
  // 172.16.x.x - 172.31.x.x
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) {
    return true;
  }

  // 192.168.0.0/16 (Private)
  if (/^192\.168\./.test(ip)) {
    return true;
  }

  // 169.254.0.0/16 (Link-Local)
  if (/^169\.254\./.test(ip)) {
    return true;
  }

  // IPv6 checks
  // ::1 (Loopback)
  if ('::1' === ip) {
    return true;
  }

  // fe80::/10 (Link-Local)
  if (/^fe80:/i.test(ip)) {
    return true;
  }

  // fc00::/7 (Unique Local Address)
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) {
    return true;
  }

  return false;
}

export async function isValidWebhookUrl(url: string): Promise<{ isSafe: boolean; resolvedIp?: string }> {
  // Allow local development based on environment variable
  if ('DEV' === process.env.PLATFORM_PROFILE_MODE) {
    logger.warn(`Skipping URL validation for ${url} in DEV mode`);
    return { isSafe: true };
  }

  try {
    const parsedUrl = new URL(url);

    // 1. Enforce HTTPS
    if ('https:' !== parsedUrl.protocol) {
      logger.warn(`Blocked webhook URL with non-HTTPS protocol: ${url}`);
      return { isSafe: false };
    }

    // 2. DNS Resolution and IP checking
    // We need to resolve the hostname to an IP address to check against private ranges
    const { address } = await lookup(parsedUrl.hostname);

    if (!address) {
      logger.warn(`Could not resolve hostname for URL: ${url}`);
      return { isSafe: false };
    }

    if (isPrivateIp(address)) {
      logger.warn(`Blocked webhook URL resolving to private/internal IP: ${url} -> ${address}`);
      return { isSafe: false };
    }

    return { isSafe: true, resolvedIp: address };
  } catch (error) {
    logger.error(`Error validating webhook URL: ${error.message}`);
    return { isSafe: false };
  }
}
