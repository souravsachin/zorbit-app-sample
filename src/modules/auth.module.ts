/**
 * Auth Module — JWT Authentication Setup
 *
 * This module registers the Passport JWT strategy and auth guard.
 * It's identical across all Zorbit business modules — you can copy
 * this module and the middleware/ files without changes.
 *
 * The only configuration needed is JWT_SECRET in your .env file,
 * which must match the secret used by zorbit-identity.
 */
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../middleware/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret-change-in-production'),
      }),
    }),
  ],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
