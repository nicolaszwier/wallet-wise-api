import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
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
import { GoogleDto } from './dto/google';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly planningsService: PlanningsService,
    private readonly i18n: I18nService,
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

    if (!user) {
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

    await this.planningsService.create(user.id, true, { currency: CurrencyType.USD, description: this.i18n.t(`plannings.defaultPlanningName`, { lang: I18nContext.current().lang }) });

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }

  private generateAccessToken(userId: string) {
    return this.jwtService.signAsync({ sub: userId });
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
      // Create new user if doesn't exist
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
      await this.planningsService.create(user.id, true, { currency: CurrencyType.USD, description: this.i18n.t(`plannings.defaultPlanningName`, { lang: I18nContext.current().lang }) });


    } else if (!user.googleId) {
      // Link Google account to existing email/password user
      await this.usersRepo.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.sub,
          locale: googleUser.locale,
          picture: googleUser.picture,
        }
      });
    }

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }
}
