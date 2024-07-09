import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';

export const ActiveUserId = createParamDecorator<undefined>((data, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  // console.log("request", request);
  const userId = request.userId;

  if (!userId) {
    throw new UnauthorizedException();
  }

  return userId;
});
