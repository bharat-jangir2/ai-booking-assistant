import { Controller, Get, Post, Body, Query, Logger, HttpCode } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('webhook')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  @HttpCode(200)
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    this.logger.log('Received webhook verification request');
    const result = this.whatsappService.verifyWebhook(mode, token, challenge);
    
    if (result === false) {
      this.logger.warn('Webhook verification failed');
    }
    
    return result;
  }

  @Post()
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    this.logger.log('Received webhook message');
    return await this.whatsappService.handleIncomingMessage(body);
  }
} 