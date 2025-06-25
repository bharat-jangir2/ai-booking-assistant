import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ChatService } from '../chat/chat.service';
import { TokenService } from './token.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly whatsappApiVersion = 'v17.0';
  private readonly whatsappPhoneNumberId: string;
  private activeSessions: Set<string> = new Set();
  private processedMessageIds: Set<string> = new Set();

  constructor(
    private readonly chatService: ChatService,
    private readonly tokenService: TokenService
  ) {
    this.whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!this.whatsappPhoneNumberId) {
      this.logger.error('WhatsApp phone number ID not found in environment variables');
    }

    // Clear old message IDs every hour
    setInterval(() => {
      this.processedMessageIds.clear();
    }, 60 * 60 * 1000);
  }

  async handleIncomingMessage(body: any) {
    try {
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.value.messages) {
              for (const message of change.value.messages) {
                // Skip if we've already processed this message
                if (this.processedMessageIds.has(message.id)) {
                  this.logger.log(`Skipping duplicate message ${message.id}`);
                  continue;
                }

                // Add message ID to processed set
                this.processedMessageIds.add(message.id);

                // Skip status messages
                if (message.type === 'status' || !message.text?.body) {
                  continue;
                }

                await this.processWhatsAppMessage(message);
              }
            }
          }
        }
      }
      return true;
    } catch (error) {
      this.logger.error('Error handling incoming WhatsApp message:', error);
      return false;
    }
  }

  private async processWhatsAppMessage(message: any) {
    try {
      const sessionId = `whatsapp_${message.from}`;
      const messageText = message.text?.body;

      if (!messageText) {
        await this.sendWhatsAppMessage(
          message.from,
          'Sorry, I can only process text messages at the moment.'
        );
        return;
      }

      // Initialize chat session if not exists
      if (!this.activeSessions.has(sessionId)) {
        try {
          const initResult = await this.chatService.startChat(sessionId);
          this.activeSessions.add(sessionId);
          this.logger.log(`Chat session initialized for ${sessionId}`);
        } catch (error) {
          this.logger.error(`Failed to initialize chat session for ${sessionId}:`, error);
          await this.sendWhatsAppMessage(
            message.from,
            'Sorry, there was an error starting our conversation. Please try again.'
          );
          return;
        }
      }

      // 1. Send immediate feedback
      await this.sendWhatsAppMessage(message.from, 'Processing your request...');

      // 2. Process message through chat service
      const response = await this.chatService.sendMessage(sessionId, messageText);

      // 3. Handle booking completion
      if (response.bookingComplete) {
        this.activeSessions.delete(sessionId);
        this.logger.log(`Booking completed for ${sessionId}`);
      }

      // 4. Send actual response
      if (response.reply) {
        await this.sendWhatsAppMessage(message.from, response.reply);
      }

    } catch (error) {
      this.logger.error('Error processing WhatsApp message:', error);
      // Clean up failed session
      const sessionId = `whatsapp_${message.from}`;
      this.activeSessions.delete(sessionId);
      await this.sendWhatsAppMessage(
        message.from,
        'Sorry, there was an error processing your message. Please try starting a new booking.'
      );
    }
  }

  async sendWhatsAppMessage(to: string, message: string) {
    try {
      // Get current token
      const token = await this.tokenService.getToken();
      if (!token) {
        throw new Error('WhatsApp access token not available');
      }

      // Format markdown to WhatsApp formatting
      const formattedMessage = this.formatMessageForWhatsApp(message);
      
      const url = `https://graph.facebook.com/${this.whatsappApiVersion}/${this.whatsappPhoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            preview_url: false,
            body: formattedMessage
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.log(`WhatsApp message sent successfully to ${to}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        this.logger.error('WhatsApp token has expired or is invalid');
      }
      this.logger.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  private formatMessageForWhatsApp(message: string): string {
    // Convert markdown to WhatsApp formatting
    return message
      .replace(/\*\*(.*?)\*\*/g, '*$1*')  // Bold
      .replace(/\n\n/g, '\n')             // Remove extra newlines
      .replace(/📋/g, '📝')               // Replace some emojis with WhatsApp compatible ones
      .replace(/➡️/g, '➡')
      .trim();
  }

  verifyWebhook(mode: string, token: string, challenge: string): number | boolean {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        this.logger.log('WhatsApp webhook verified');
        return Number(challenge);
      }
      return false;
    }
    return false;
  }

  async getTokenStatus() {
    return await this.tokenService.getTokenStatus();
  }

  async updateToken(newToken: string, expirationDays?: number) {
    return await this.tokenService.updateToken(newToken, expirationDays);
  }
} 