import { Module } from '@nestjs/common';
import { HealthcheckModule } from './modules/healthcheck/healthcheck.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChartModule } from './modules/chart/chart.module';
import { PlaydataModule } from './modules/playdata/playdata.module';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './modules/account/account.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TagModule } from './modules/tag/tag.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
      serveRoot: '/static',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    HealthcheckModule,
    ChartModule,
    PlaydataModule,
    AccountModule,
    TagModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
