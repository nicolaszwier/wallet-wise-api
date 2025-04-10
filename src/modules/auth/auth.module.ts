import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { env } from 'src/shared/config/env';
import { PlanningsModule } from '../plannings/plannings.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: '90d' },
      secret: env.jwtSecret,
    }),
    PlanningsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
