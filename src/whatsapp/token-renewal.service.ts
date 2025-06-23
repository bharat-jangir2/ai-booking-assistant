import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenService } from './token.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenRenewalService {
  private readonly logger = new Logger(TokenRenewalService.name);
  private readonly whatsappApiVersion = 'v17.0';

  constructor(
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAndRenewToken() {
    try {
      this.logger.log('Running scheduled token check and renewal');
      
      const tokenStatus = await this.tokenService.getTokenStatus();
      
      // If token is valid but expires in less than 3 days, renew it
      if (tokenStatus.isValid && tokenStatus.daysRemaining && tokenStatus.daysRemaining <= 3) {
        await this.renewToken();
      }
      // If token is invalid, try to renew immediately
      else if (!tokenStatus.isValid) {
        await this.renewToken();
      } else {
        this.logger.log(`Token is valid for ${tokenStatus.daysRemaining} more days`);
      }
    } catch (error) {
      this.logger.error('Error in token renewal cron job:', error);
    }
  }

  private async renewToken() {
    try {
      this.logger.log('Attempting to renew WhatsApp token');

      const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
      const currentToken = await this.tokenService.getToken();

      if (!phoneNumberId || !currentToken) {
        throw new Error('Missing required configuration for token renewal');
      }

      // Verify current token still works by making a test API call
      const testUrl = `https://graph.facebook.com/${this.whatsappApiVersion}/${phoneNumberId}`;
      const response = await axios.get(testUrl, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (response.status === 200) {
        // If current token works, extend its validity
        await this.tokenService.updateToken(currentToken, 60); // Extend for 60 days
        this.logger.log('Successfully renewed WhatsApp token');
      } else {
        this.logger.warn('Failed to verify current token during renewal');
      }
    } catch (error) {
      this.logger.error('Error renewing WhatsApp token:', error);
      
      // Try to get a new token from environment variables as fallback
      const envToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
      if (envToken) {
        try {
          await this.tokenService.updateToken(envToken, 60);
          this.logger.log('Successfully updated token from environment variables');
        } catch (fallbackError) {
          this.logger.error('Failed to update token from environment variables:', fallbackError);
        }
      }
    }
  }
} 