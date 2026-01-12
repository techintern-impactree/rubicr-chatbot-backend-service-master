import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RephraseService } from './rephrase.service';
import { RephraseRequestDto } from './dto/rephrase.dto';

@Controller()
export class RephraseController {
    constructor(private readonly rephraseService: RephraseService) { }

    @Post('/rephrase')
    @HttpCode(HttpStatus.OK)
    async handleRephrase(@Body() data: RephraseRequestDto) {
        return this.rephraseService.processRephrase(data);
    }
}
