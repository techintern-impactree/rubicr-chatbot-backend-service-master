import { Module } from '@nestjs/common';
import { RephraseController } from './rephrase.controller';
import { RephraseService } from './rephrase.service';

@Module({
    controllers: [RephraseController],
    providers: [RephraseService],
})
export class RephraseModule { }
