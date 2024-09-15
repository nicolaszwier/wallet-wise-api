import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { IsPublic } from 'src/shared/decorators/IsPublic';
// import { CreateUserSupportDto } from './dto/create-support.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/my-profile')
  me(@ActiveUserId() userId: string) {
    return this.usersService.getUserById(userId);
  }

  // @IsPublic()
  // @Post('/support')
  // support(@Body() createUserSupportDto: CreateUserSupportDto[]) {
  //   throw new HttpException('Something wrong happened', HttpStatus.BAD_REQUEST);
  //   // return this.transactionsService.createMany(userId, createTransactionDto);
  // }

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
