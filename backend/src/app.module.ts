import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContributionsModule } from './modules/contributions/contributions.module';
import { LoansModule } from './modules/loans/loans.module';
import { FinesModule } from './modules/fines/fines.module';
import { EventsModule } from './modules/events/events.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { AppConfigModule } from './modules/config/config.module';
import { SeederModule } from './database/seeders/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_DATABASE', 'fodaf'),
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        synchronize: false, // Desactivado - usar migraciones
        logging: configService.get('NODE_ENV') !== 'production',
      }),
    }),
    RolesModule,
    UsersModule,
    AuthModule,
    ContributionsModule,
    LoansModule,
    FinesModule,
    EventsModule,
    InvestmentsModule,
    AppConfigModule,
    SeederModule,
  ],
})
export class AppModule {}
