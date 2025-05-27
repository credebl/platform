import { type ExecutionContext, createParamDecorator } from '@nestjs/common'
import type { RequestingUser } from '../dtos/requesting-user.dto'

export const GetUser = createParamDecorator((_data, ctx: ExecutionContext): RequestingUser => {
  const req = ctx.switchToHttp().getRequest()
  return req.requestor
})
