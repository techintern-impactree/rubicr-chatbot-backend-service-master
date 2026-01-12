import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class RephraseRequestDto {
    @IsString({ message: 'Text must be a string' })
    @IsNotEmpty({ message: 'Text parameter cannot be empty' })
    text: string;

    @IsOptional()
    @IsString()
    webpageContent?: string;
}
