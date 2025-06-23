import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { ChatService } from '../chat/chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { TokenService } from './token.service';
import { ConfigModule } from '@nestjs/config';
import { TokenController } from './token.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenRenewalService } from './token-renewal.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema }
    ]),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [WhatsappController, TokenController],
  providers: [WhatsappService, ChatService, TokenService, TokenRenewalService],
})
export class WhatsappModule {} 