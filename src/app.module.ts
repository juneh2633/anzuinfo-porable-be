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
import { ScheduleModule } from '@nestjs/schedule';
import { AwsModule } from './aws/aws.module';

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
    AwsModule,
    AuthModule,
    HealthcheckModule,
    ChartModule,
    PlaydataModule,
    AccountModule,
    TagModule,
    ScheduleModule.forRoot(),
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
