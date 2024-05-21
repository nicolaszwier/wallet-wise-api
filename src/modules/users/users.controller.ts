import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { IsPublic } from 'src/shared/decorators/IsPublic';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/my-profile')
  me(@ActiveUserId() userId: string) {
    return this.usersService.getUserById(userId);
  }

  @IsPublic()
  @Get('/status')
  status() {
    return {
      statusCode: 200,
      message: 'WalletWise API is live',
      error: null,
    };
  }
}
