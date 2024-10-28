import { Body, Controller, Delete, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { IsPublic } from 'src/shared/decorators/IsPublic';
import { CreateSupportRequestDto } from './dto/create-user-support.dto';
// import { CreateUserSupportDto } from './dto/create-support.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/my-profile')
  me(@ActiveUserId() userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Delete('/delete-account')
  deleteAccount(@ActiveUserId() userId: string) {
    return this.usersService.deleteAccount(userId);
  }

  @IsPublic()
  @Post('/support')
  support(@Body() createUserSupportDto: CreateSupportRequestDto) {
    return this.usersService.createSupport(createUserSupportDto);
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
