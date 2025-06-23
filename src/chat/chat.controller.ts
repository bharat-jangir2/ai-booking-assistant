import { Controller, Post, Get, Body, Res, HttpStatus, Param } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';

@Controller('api')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  async startChat(@Body() body: { sessionId: string }, @Res() res: Response) {
    try {
      const result = await this.chatService.startChat(body.sessionId);
      res.json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        error: error.message || 'Failed to start chat session' 
      });
    }
  }

  @Post('chat')
  async sendMessage(@Body() body: { sessionId: string; message: string }, @Res() res: Response) {
    try {
      const result = await this.chatService.sendMessage(body.sessionId, body.message);
      res.json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        error: error.message || 'Failed to process message' 
      });
    }
  }

  @Get('bookings')
  async getAllBookings(@Res() res: Response) {
    try {
      const bookings = await this.chatService.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        error: error.message || 'Failed to fetch bookings' 
      });
    }
  }

  @Get('bookings/:id')
  async getBookingById(@Param('id') id: string, @Res() res: Response) {
    try {
      const booking = await this.chatService.getBookingById(id);
      res.json(booking);
    } catch (error) {
      if (error.message === 'Booking not found') {
        res.status(HttpStatus.NOT_FOUND).json({
          error: 'Booking not found'
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: error.message || 'Failed to fetch booking'
        });
      }
    }
  }

  @Post('test-booking')
  async testBooking(@Res() res: Response) {
    try {
      const result = await this.chatService.testBooking();
      res.json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  }

  @Get('health')
  async healthCheck(@Res() res: Response) {
    res.json({ 
      status: 'OK', 
      message: 'Car Booking Chatbot is running!' 
    });
  }
} 