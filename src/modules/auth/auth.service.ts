import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from 'src/shared/database/repositories/users.repositories';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SigninDto } from './dto/signin';
import { SignupDto } from './dto/signup';
import { defaultCategories } from 'src/shared/database/data/categories';
import { PlanningsService } from '../plannings/services/plannings.service';
import { CurrencyType } from '../plannings/model/Currency';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { GoogleDto } from './dto/google';
import { AppleDto } from './dto/apple';
import { MailService } from 'src/shared/mail/mail.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from 'src/shared/utils/password-reset.util';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly planningsService: PlanningsService,
    private readonly i18n: I18nService,
    private readonly mailService: MailService,
  ) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
  }

  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;

    const user = await this.usersRepo.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }

  async signup(signupDto: SignupDto) {
    const { name, email, password } = signupDto;

    const emailTaken = await this.usersRepo.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailTaken) {
      throw new ConflictException('This email is already in use.');
    }

    const hashedPassword = await hash(password, 12);
    const lang = this.getLang();

    const user = await this.usersRepo.create({
      data: {
        name,
        email,
        password: hashedPassword,
        active: true,
        dateOfCreation: new Date(),
        categories: {
          createMany: {
            data: defaultCategories,
          },
        },
      },
    });

    await this.planningsService.create(user.id, true, {
      currency: CurrencyType.USD,
      description: this.i18n.t(`plannings.defaultPlanningName`, { lang }),
    });

    this.mailService.sendWelcomeEmailSafe({ to: email, name, lang });

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.usersRepo.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user?.password) {
      throw new BadRequestException(
        'No password is set for this account. Use forgot password to set one.',
      );
    }

    const isPasswordValid = await compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const hashedPassword = await hash(newPassword, 12);

    await this.usersRepo.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully.' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const lang = this.getLang();

    const user = await this.usersRepo.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, active: true },
    });

    if (user?.active) {
      const rawToken = generatePasswordResetToken();
      const hashedToken = hashPasswordResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await this.usersRepo.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expiresAt,
        },
      });

      this.mailService.sendResetPasswordEmailSafe({
        to: user.email,
        name: user.name,
        token: rawToken,
        lang,
      });
    }

    return { message: 'If an account exists, a reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;
    const hashedToken = hashPasswordResetToken(token);

    const user = await this.usersRepo.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const hashedPassword = await hash(newPassword, 12);

    await this.usersRepo.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully.' };
  }

  private generateAccessToken(userId: string) {
    return this.jwtService.signAsync({ sub: userId });
  }

  private getLang() {
    return I18nContext.current()?.lang ?? 'en';
  }

  async validateGoogleToken(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_ID_IOS],
      });
      const payload = ticket.getPayload();
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async signInWithGoogle(googleDto: GoogleDto) {
    const googleUser = await this.validateGoogleToken(googleDto.token);
    let user = await this.usersRepo.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      const lang = this.getLang();

      user = await this.usersRepo.create({
        data: {
          googleId: googleUser.sub,
          name: googleUser.name,
          email: googleUser.email,
          locale: googleUser.locale,
          picture: googleUser.picture,
          active: true,
          dateOfCreation: new Date(),
          categories: {
            createMany: {
              data: defaultCategories,
            },
          },
        },
      });
      await this.planningsService.create(user.id, true, {
        currency: CurrencyType.USD,
        description: this.i18n.t(`plannings.defaultPlanningName`, { lang }),
      });

      this.mailService.sendWelcomeEmailSafe({
        to: googleUser.email,
        name: googleUser.name,
        lang,
      });
    } else if (!user.googleId) {
      await this.usersRepo.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.sub,
          locale: googleUser.locale,
          picture: googleUser.picture,
        },
      });
    }

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }

  async validateAppleToken(token: string) {
    try {
      const payload = await appleSignin.verifyIdToken(token, {
        audience: [process.env.APPLE_CLIENT_ID, process.env.APPLE_CLIENT_ID_IOS],
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid Apple token');
    }
  }

  async signInWithApple(appleDto: AppleDto) {
    const appleUser = await this.validateAppleToken(appleDto.token);

    let user = await this.usersRepo.findFirst({
      where: { appleId: appleUser.sub },
    });

    if (!user && appleUser.email) {
      user = await this.usersRepo.findUnique({
        where: { email: appleUser.email },
      });
    }

    if (!user) {
      if (!appleUser.email) {
        throw new UnauthorizedException('Invalid Apple token');
      }

      const lang = this.getLang();
      const name = appleDto.name ?? appleUser.email.split('@')[0];

      user = await this.usersRepo.create({
        data: {
          appleId: appleUser.sub,
          name,
          email: appleUser.email,
          active: true,
          dateOfCreation: new Date(),
          categories: {
            createMany: {
              data: defaultCategories,
            },
          },
        },
      });
      await this.planningsService.create(user.id, true, {
        currency: CurrencyType.USD,
        description: this.i18n.t(`plannings.defaultPlanningName`, { lang }),
      });

      this.mailService.sendWelcomeEmailSafe({ to: appleUser.email, name, lang });
    } else if (!user.appleId) {
      await this.usersRepo.update({
        where: { id: user.id },
        data: {
          appleId: appleUser.sub,
        },
      });
    }

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }
}
