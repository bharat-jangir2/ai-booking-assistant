import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name);
  private currentToken: string | null = null;
  private tokenFilePath: string;

  constructor(private configService: ConfigService) {
    this.tokenFilePath = path.join(process.cwd(), 'tokens', 'whatsapp-token.json');
  }

  async onModuleInit() {
    this.logger.log('Initializing TokenService...');
    await this.initializeTokenStorage();
  }

  private async initializeTokenStorage() {
    try {
      this.logger.log(`Using token file path: ${this.tokenFilePath}`);
      
      // Create tokens directory if it doesn't exist
      const tokensDir = path.dirname(this.tokenFilePath);
      await fs.mkdir(tokensDir, { recursive: true });
      this.logger.log('Tokens directory created/verified');

      // Try to load existing token from file
      try {
        this.logger.log('Attempting to load token from file...');
        const tokenData = await fs.readFile(this.tokenFilePath, 'utf8');
        this.logger.debug(`Token data from file: ${tokenData}`);
        
        const { token, expiresAt } = JSON.parse(tokenData);
        
        // Check if token is still valid
        if (expiresAt && new Date(expiresAt) > new Date()) {
          this.currentToken = token;
          this.logger.log('Successfully loaded valid token from file');
          
          // Schedule token expiration check
          this.scheduleTokenExpirationCheck(new Date(expiresAt));
        } else {
          this.logger.warn('Stored token has expired, will try environment variable');
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.logger.log('No token file found, will try environment variable');
        } else {
          this.logger.error('Error reading token file:', error);
        }
        
        // If no token file exists or there was an error, try loading from environment
        const envToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
        if (envToken) {
          this.logger.log('Found token in environment variables, updating storage');
          await this.updateToken(envToken);
        } else {
          this.logger.warn('No WhatsApp token available in file or environment');
        }
      }
    } catch (error) {
      this.logger.error('Error initializing token storage:', error);
    }
    
    // Log final token status
    if (this.currentToken) {
      this.logger.log('Token initialization completed successfully');
    } else {
      this.logger.error('Failed to initialize token - no valid token available');
    }
  }

  private scheduleTokenExpirationCheck(expiresAt: Date) {
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    // Alert 24 hours before expiration
    const alertTime = timeUntilExpiry - (24 * 60 * 60 * 1000);
    if (alertTime > 0) {
      setTimeout(() => {
        this.logger.warn('⚠️ WhatsApp token will expire in 24 hours! Please update the token.');
      }, alertTime);
    }

    // Alert at expiration
    if (timeUntilExpiry > 0) {
      setTimeout(() => {
        this.logger.error('🚨 WhatsApp token has expired! Please update the token immediately.');
        this.currentToken = null;
      }, timeUntilExpiry);
    }
  }

  async updateToken(newToken: string, expirationDays: number = 7) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      const tokenData = {
        token: newToken,
        expiresAt: expiresAt.toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save token to file
      await fs.writeFile(
        this.tokenFilePath,
        JSON.stringify(tokenData, null, 2),
        'utf8'
      );

      this.currentToken = newToken;
      this.scheduleTokenExpirationCheck(expiresAt);

      this.logger.log('WhatsApp token updated successfully');
      return true;
    } catch (error) {
      this.logger.error('Error updating WhatsApp token:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    return this.currentToken;
  }

  async getTokenStatus(): Promise<{
    isValid: boolean;
    expiresAt?: string;
    daysRemaining?: number;
  }> {
    try {
      const tokenData = await fs.readFile(this.tokenFilePath, 'utf8');
      const { expiresAt } = JSON.parse(tokenData);
      
      if (!expiresAt) {
        return { isValid: false };
      }

      const expiryDate = new Date(expiresAt);
      const now = new Date();
      const isValid = expiryDate > now;
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        isValid,
        expiresAt,
        daysRemaining
      };
    } catch (error) {
      return { isValid: false };
    }
  }
} 