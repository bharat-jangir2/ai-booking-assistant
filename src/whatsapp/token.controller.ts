import { Controller, Post, Get, Body, HttpStatus, HttpException } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp/token')
export class TokenController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('update')
  async updateToken(
    @Body() body: { token: string; expirationDays?: number }
  ) {
    if (!body.token) {
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);
    }

    const success = await this.whatsappService.updateToken(
      body.token,
      body.expirationDays
    );

    if (!success) {
      throw new HttpException(
        'Failed to update token',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return { message: 'Token updated successfully' };
  }

  @Get('status')
  async getTokenStatus() {
    const status = await this.whatsappService.getTokenStatus();
    return status;
  }
} 