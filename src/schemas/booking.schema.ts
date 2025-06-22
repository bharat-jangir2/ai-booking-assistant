import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  pickupLocation: string;

  @Prop({ required: true })
  destination: string;

  @Prop({ required: true })
  pickupTime: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking); 