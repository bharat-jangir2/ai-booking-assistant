import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { Booking, BookingDocument } from '../schemas/booking.schema';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private openai: OpenAI;
  private assistantId: string | null = null;
  private threads: { [sessionId: string]: string } = {};
  private bookingSaved: { [sessionId: string]: boolean } = {}; // Track if booking is saved per session
  private savedBookings: { [sessionId: string]: any } = {}; // Store saved booking data per session

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.initializeAssistant();
  }

  private async initializeAssistant() {
    try {
      const assistant = await this.openai.beta.assistants.create({
        name: "Car Booking Assistant",
        instructions: `You are a helpful car booking assistant. Your job is to collect booking information from users step by step.

Booking Information to Collect:
1. Customer Name
2. Mobile Number
3. Pickup Location
4. Destination
5. Pickup Date and Time

Guidelines:
- Be friendly and professional
- Ask for one piece of information at a time
- Validate inputs when possible (e.g., phone number format)
- Once all information is collected, confirm the booking
- Use clear, simple language
- If user provides multiple pieces of information at once, acknowledge and ask for the next required field

When all information is collected, respond with: "BOOKING_COMPLETE" followed by the booking details in JSON format.

Example response when complete:
"BOOKING_COMPLETE: {
  "name": "John Doe",
  "phone": "1234567890",
  "pickupLocation": "Airport Terminal 1",
  "destination": "Downtown Hotel",
  "pickupTime": "2024-01-15 14:30"
}"`,
        model: "gpt-4-turbo-preview",
        tools: [
          {
            type: "function",
            function: {
              name: "save_booking",
              description: "Save the booking information to the database",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Customer's full name"
                  },
                  phone: {
                    type: "string",
                    description: "Customer's mobile number"
                  },
                  pickupLocation: {
                    type: "string",
                    description: "Pickup location address"
                  },
                  destination: {
                    type: "string",
                    description: "Destination address"
                  },
                  pickupTime: {
                    type: "string",
                    description: "Pickup date and time"
                  }
                },
                required: ["name", "phone", "pickupLocation", "destination", "pickupTime"]
              }
            }
          }
        ]
      });
      
      this.assistantId = assistant.id;
      this.logger.log(`✅ Assistant created with ID: ${this.assistantId}`);
    } catch (error) {
      this.logger.error('❌ Error creating assistant:', error);
    }
  }

  private getMessageText(content: any[]): string {
    for (const item of content) {
      if (item.type === 'text' && item.text) {
        return item.text.value;
      }
    }
    return '';
  }

  async startChat(sessionId: string) {
    try {
      if (!this.assistantId) {
        throw new Error('Assistant not initialized');
      }

      // Create a new thread for this session
      const thread = await this.openai.beta.threads.create();
      this.threads[sessionId] = thread.id;

      // Send initial message
      const message = await this.openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: "Hello! I'd like to book a car. Can you help me with that?"
      });

      // Run the assistant
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: this.assistantId
      });

      // Wait for the run to complete
      let runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      // Get the response
      const messages = await this.openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];
      const replyText = this.getMessageText(lastMessage.content);

      return {
        sessionId,
        reply: replyText
      };

    } catch (error) {
      this.logger.error('Error starting chat:', error);
      throw new Error('Failed to start chat session');
    }
  }

  async sendMessage(sessionId: string, message: string) {
    try {
      if (!this.threads[sessionId]) {
        throw new Error('Invalid session. Please start a new chat.');
      }

      const threadId = this.threads[sessionId];

      // Add user message to thread
      await this.openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message
      });

      // Run the assistant
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId
      });

      // Wait for the run to complete
      let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
      
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
      }

      // Handle function calls if any
      if (runStatus.status === 'requires_action' && runStatus.required_action?.type === 'submit_tool_outputs') {
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        
        const toolOutputs = [];
        
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'save_booking' && !this.bookingSaved[sessionId]) {
            const bookingData = JSON.parse(toolCall.function.arguments);
            
            // Save to MongoDB
            const booking = new this.bookingModel(bookingData);
            const savedBooking = await booking.save();
            
            // Mark booking as saved for this session and store the data
            this.bookingSaved[sessionId] = true;
            this.savedBookings[sessionId] = savedBooking;
            
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({
                success: true,
                bookingId: savedBooking._id,
                message: `Booking confirmed! Booking ID: ${savedBooking._id}`
              })
            });
          }
        }

        // Submit tool outputs
        await this.openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
          tool_outputs: toolOutputs
        });

        // Wait for the final response
        let finalRunStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
        while (finalRunStatus.status === 'in_progress' || finalRunStatus.status === 'queued') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          finalRunStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
        }
      }

      // Get the response
      const messages = await this.openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];
      const responseText = this.getMessageText(lastMessage.content);

      // Check if booking is complete (only if not already saved via function call)
      if (responseText.includes('BOOKING_COMPLETE:') && !this.bookingSaved[sessionId]) {
        this.logger.log('🔍 Detected BOOKING_COMPLETE in response:', responseText);
        
        // Extract booking details and save to MongoDB
        const bookingMatch = responseText.match(/BOOKING_COMPLETE:\s*({[\s\S]*})/);
        if (bookingMatch) {
          try {
            this.logger.log('📝 Extracted booking data:', bookingMatch[1]);
            const bookingData = JSON.parse(bookingMatch[1]);
            this.logger.log('✅ Parsed booking data:', bookingData);
            
            const booking = new this.bookingModel(bookingData);
            this.logger.log('💾 Attempting to save booking to database...');
            
            const savedBooking = await booking.save();
            this.logger.log('✅ Booking saved successfully:', savedBooking._id);

            // Mark booking as saved for this session
            this.bookingSaved[sessionId] = true;

            // Clean up session
            delete this.threads[sessionId];
            delete this.bookingSaved[sessionId];

            return {
              sessionId,
              reply: `✅ **Booking Confirmed!**\n\n📋 **Booking Summary:**\n👤 **Name:** ${savedBooking.name}\n📞 **Phone:** ${savedBooking.phone}\n📍 **Pickup:** ${savedBooking.pickupLocation}\n➡️ **Destination:** ${savedBooking.destination}\n🕓 **Time:** ${savedBooking.pickupTime}\n\n🎫 **Booking ID:** ${savedBooking._id}\n\nThank you for choosing our service! We'll contact you shortly to confirm your booking.`,
              bookingComplete: true,
              bookingId: savedBooking._id
            };
          } catch (parseError) {
            this.logger.error('❌ Error parsing booking data:', parseError);
            this.logger.error('❌ Raw booking match:', bookingMatch[1]);
            
            // Try to save even if JSON parsing fails
            try {
              // Clean the string and try to parse again
              const cleanedData = bookingMatch[1].replace(/\n/g, '').replace(/\r/g, '').trim();
              this.logger.log('🧹 Cleaned booking data:', cleanedData);
              
              const bookingData = JSON.parse(cleanedData);
              const booking = new this.bookingModel(bookingData);
              const savedBooking = await booking.save();
              
              this.logger.log('✅ Booking saved after cleanup:', savedBooking._id);
              
              // Mark booking as saved for this session
              this.bookingSaved[sessionId] = true;
              
              delete this.threads[sessionId];
              delete this.bookingSaved[sessionId];
              
              return {
                sessionId,
                reply: `✅ **Booking Confirmed!**\n\n📋 **Booking Summary:**\n👤 **Name:** ${savedBooking.name}\n📞 **Phone:** ${savedBooking.phone}\n📍 **Pickup:** ${savedBooking.pickupLocation}\n➡️ **Destination:** ${savedBooking.destination}\n🕓 **Time:** ${savedBooking.pickupTime}\n\n🎫 **Booking ID:** ${savedBooking._id}\n\nThank you for choosing our service! We'll contact you shortly to confirm your booking.`,
                bookingComplete: true,
                bookingId: savedBooking._id
              };
            } catch (saveError) {
              this.logger.error('❌ Failed to save booking after cleanup:', saveError);
              return {
                sessionId,
                reply: '❌ Sorry, there was an error saving your booking. Please try again or contact support.',
                error: true
              };
            }
          }
        } else {
          this.logger.log('❌ No booking data found in BOOKING_COMPLETE response');
          this.logger.log('🔍 Full response text:', responseText);
        }
      }

      // If booking was saved via function call, return completion message
      if (this.bookingSaved[sessionId]) {
        const savedBooking = this.savedBookings[sessionId];
        delete this.threads[sessionId];
        delete this.bookingSaved[sessionId];
        delete this.savedBookings[sessionId];
        
        return {
          sessionId,
          reply: `✅ **Booking Confirmed!**\n\n📋 **Booking Summary:**\n👤 **Name:** ${savedBooking.name}\n📞 **Phone:** ${savedBooking.phone}\n📍 **Pickup:** ${savedBooking.pickupLocation}\n➡️ **Destination:** ${savedBooking.destination}\n🕓 **Time:** ${savedBooking.pickupTime}\n\n🎫 **Booking ID:** ${savedBooking._id}\n\nThank you for choosing our service! We'll contact you shortly to confirm your booking.`,
          bookingComplete: true,
          bookingId: savedBooking._id
        };
      }

      return {
        sessionId,
        reply: responseText
      };

    } catch (error) {
      this.logger.error('Error in chat:', error);
      throw new Error('Failed to process message');
    }
  }

  async getAllBookings() {
    try {
      return await this.bookingModel.find().sort({ createdAt: -1 }).exec();
    } catch (error) {
      this.logger.error('Error fetching bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  async testBooking() {
    try {
      const testBooking = new this.bookingModel({
        name: 'Test User',
        phone: '1234567890',
        pickupLocation: 'Test Location',
        destination: 'Test Destination',
        pickupTime: '2024-01-01 12:00'
      });
      
      const savedBooking = await testBooking.save();
      this.logger.log('✅ Test booking saved:', savedBooking._id);
      
      return {
        success: true,
        message: 'Test booking saved successfully',
        bookingId: savedBooking._id,
        booking: savedBooking
      };
    } catch (error) {
      this.logger.error('❌ Test booking failed:', error);
      throw error;
    }
  }
} 