import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export async function validateNoticeUrl(noticeUrl: string): Promise<void> {
  if (!noticeUrl || !noticeUrl.trim()) {
    throw new RpcException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'noticeUrl must not be empty.'
    });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(noticeUrl, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `noticeUrl is not reachable (HTTP ${response.status}).`
      });
    }
  } catch (err) {
    if (err instanceof RpcException) {
      throw err;
    }
    throw new RpcException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `noticeUrl could not be resolved: ${err?.message ?? 'unreachable'}`
    });
  }
}
