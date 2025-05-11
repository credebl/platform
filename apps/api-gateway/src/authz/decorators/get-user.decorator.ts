import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestingUser } from '../dtos/requesting-user.dto';

export const GetUser = createParamDecorator((data, ctx: ExecutionContext): RequestingUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.requestor;
});
