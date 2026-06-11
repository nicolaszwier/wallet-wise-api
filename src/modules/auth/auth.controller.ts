import { Body, Controller, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin';
import { SignupDto } from './dto/signup';
import { IsPublic } from 'src/shared/decorators/IsPublic';
import { GoogleDto } from './dto/google';
import { AppleDto } from './dto/apple';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @Post('signin')
  signin(@Body() signinDto: SigninDto) {
    return this.authService.signin(signinDto);
  }

  @IsPublic()
  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @IsPublic()
  @Post('google')
  google(@Body() googleDto: GoogleDto) {
    return this.authService.signInWithGoogle(googleDto);
  }

  @IsPublic()
  @Post('apple')
  apple(@Body() appleDto: AppleDto) {
    return this.authService.signInWithApple(appleDto);
  }

  @Patch('change-password')
  changePassword(@ActiveUserId() userId: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @IsPublic()
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @IsPublic()
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
