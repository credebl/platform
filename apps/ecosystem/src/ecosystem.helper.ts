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
    const response = await fetch(noticeUrl);
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
