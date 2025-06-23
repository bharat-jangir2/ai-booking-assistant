import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/car_booking_db'),
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema }
    ]),
    WhatsappModule,
  ],
  controllers: [AppController, ChatController],
  providers: [ChatService],
})
export class AppModule {} 