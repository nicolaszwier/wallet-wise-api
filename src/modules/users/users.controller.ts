import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/my-profile')
  me(@ActiveUserId() userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Get('/status')
  status() {
    return {
      statusCode: 200,
      message: 'WalletWise API is live',
      error: null,
    };
  }
}
