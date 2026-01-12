import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { marked } from 'marked';
import { RephraseRequestDto } from './dto/rephrase.dto';

@Injectable()
export class RephraseService {
    private readonly logger = new Logger(RephraseService.name);
    private genAI: GoogleGenerativeAI;
    private readonly modelName = "gemini-2.5-flash";

    // Consolidating system instruction for easier maintenance
    private readonly systemInstruction = `You are an expert AI named THAMBI. Your primary roles are to rephrase text and provide insights based on given content. Always format your responses clearly using Markdown. Start with a main heading (e.g., # Rephrased Content or # Key Insights). Use sub-headings (e.g., ## Option 1, ## Main Points) to organize different sections of your answer. Present your main content as readable paragraphs under the appropriate headings but never try to generate a tabular format. just present the information in text. Never use '*' to mark important points. When rephrasing, offer multiple options (not more than 3) and present them clearly, either using numbered lists or distinct sub-headings for each option. When asked for insights or summaries, if a webpage context is provided, use that context to formulate your answer, but only when it is directly relevant to the user's query. Be clear, accurate, concise, and helpful. Keep rephrased text simple, like: 'the books are found to be in library'.`;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GOOGLE_GEMINI_API');
        if (!apiKey) {
            this.logger.error('GOOGLE_GEMINI_API environment variable is missing');
            // We don't throw here to allow app to start, but requests will fail. 
            // Ideally handled by config validation schema.
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    async processRephrase(data: RephraseRequestDto): Promise<{ text: string }> {
        if (!this.genAI) {
            throw new InternalServerErrorException('Server is not configured with AI credentials.');
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: this.modelName });
            const prompt = this.buildPrompt(data);

            const chat = model.startChat({
                history: [],
                systemInstruction: { role: "system", parts: [{ text: this.systemInstruction }] },
            });

            this.logger.log(`Processing request for text length: ${data.text.length}`);

            const result = await chat.sendMessage(prompt);
            const responseText = result.response.text();
            const formattedMarkdown = this.ensureBasicMarkdownStructure(responseText);
            const htmlContent = await this.convertMarkdownToHtml(formattedMarkdown);

            return { text: htmlContent };

        } catch (error) {
            this.logger.error(`AI Generation failed: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to process AI request.');
        }
    }

    private buildPrompt(data: RephraseRequestDto): string {
        const userPrompt = data.text.trim();
        let combinedQuery = `User's request: '${userPrompt}'`;

        if (data.webpageContent && data.webpageContent.trim() !== '') {
            combinedQuery += `\n\n--- Webpage Context ---\n${data.webpageContent.trim()}\n--- End Webpage Context ---`;
            combinedQuery += "\n\nGiven the user's request and the provided webpage context, please provide rephrasing or insights. Use the webpage context only if it's relevant to the user's query.";
        } else {
            combinedQuery += "\n\nGiven the user's request, please provide rephrasing or insights.";
        }

        combinedQuery += " Ensure your response is well-formatted using Markdown (headings, sub-headings, and paragraphs).";
        return combinedQuery;
    }

    private ensureBasicMarkdownStructure(text: string): string {
        if (!text) return "# No Content Generated";
        const trimmed = text.trim();
        if (/^#{1,6}\s/m.test(trimmed)) {
            return trimmed;
        }
        return `# Response: \n\n${trimmed}`;
    }

    private async convertMarkdownToHtml(mdText: string): Promise<string> {
        return marked.parse(mdText) as string;
    }
}
