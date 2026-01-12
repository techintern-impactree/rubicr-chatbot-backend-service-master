import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RephraseModule } from './rephrase/rephrase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RephraseModule,
  ],
})
export class AppModule { }