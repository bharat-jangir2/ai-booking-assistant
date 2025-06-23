"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const openai_1 = require("openai");
const booking_schema_1 = require("../schemas/booking.schema");
let ChatService = ChatService_1 = class ChatService {
    constructor(bookingModel) {
        this.bookingModel = bookingModel;
        this.logger = new common_1.Logger(ChatService_1.name);
        this.assistantId = null;
        this.threads = {};
        this.activeRuns = {};
        this.bookingSaved = {};
        this.savedBookings = {};
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.initializeAssistant();
    }
    async initializeAssistant() {
        try {
            const assistant = await this.openai.beta.assistants.create({
                name: "Car Booking Assistant",
                instructions: `IMPORTANT: Only answer questions related to car booking. 
If the user asks about anything else (e.g., weather, news, general questions), respond with: 
"Sorry, I can only assist with car bookings. Please provide your booking details."

You are a helpful car booking assistant. Your job is to:
1. Collect booking information from users step by step for new bookings
2. Help users check their existing booking details when they provide a booking ID

For Checking Booking Details:
- When users ask about their booking or provide a booking ID, use the get_booking function to fetch the details
- Format the response in a user-friendly way
- If the booking is not found, inform the user politely
- If there's an error, apologize and ask them to try again

For New Bookings:
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

Date Handling:
- When asking for pickup date and time, be flexible with date formats
- If user provides only a day (e.g., "15"), assume current month and year
- If user provides day/month (e.g., "15/3"), assume current year
- If user provides day + month name (e.g., "25 june", "15 january"), assume current year
- Accept formats like: "15", "15/3", "15-3", "25 june", "15 january", "2024-03-15", "15/3/2024"
- Always convert dates to YYYY-MM-DD format for the final booking
- Use the parse_date function when you need to convert user date input to proper format
- When user provides a date, use parse_date function to ensure it's in the correct format before saving

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
                            name: "get_booking",
                            description: "Fetch booking details using booking ID",
                            parameters: {
                                type: "object",
                                properties: {
                                    bookingId: {
                                        type: "string",
                                        description: "The ID of the booking to fetch"
                                    }
                                },
                                required: ["bookingId"]
                            }
                        }
                    },
                    {
                        type: "function",
                        function: {
                            name: "parse_date",
                            description: "Parse date input and convert to YYYY-MM-DD format. Supports day only (uses current month/year), day/month (uses current year), day + month name (e.g., '25 june' uses current year), and full dates.",
                            parameters: {
                                type: "object",
                                properties: {
                                    dateInput: {
                                        type: "string",
                                        description: "Date input from user (can be just day, day/month, day + month name, or full date)"
                                    }
                                },
                                required: ["dateInput"]
                            }
                        }
                    },
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
                                        description: "Pickup date and time in YYYY-MM-DD HH:MM format"
                                    }
                                },
                                required: ["name", "phone", "pickupLocation", "destination", "pickupTime"]
                            }
                        }
                    }
                ]
            });
            this.assistantId = assistant.id;
            this.logger.log('✅ Assistant created successfully');
        }
        catch (error) {
            this.logger.error('❌ Error creating assistant:', error);
            throw error;
        }
    }
    getMessageText(content) {
        for (const item of content) {
            if (item.type === 'text' && item.text) {
                return item.text.value;
            }
        }
        return '';
    }
    async startChat(sessionId) {
        try {
            if (!this.assistantId) {
                throw new Error('Assistant not initialized');
            }
            const thread = await this.openai.beta.threads.create();
            this.threads[sessionId] = thread.id;
            if (!sessionId.startsWith('whatsapp_')) {
                const message = await this.openai.beta.threads.messages.create(thread.id, {
                    role: "user",
                    content: "Hello! I'd like to book a car. Can you help me with that?"
                });
                const run = await this.openai.beta.threads.runs.create(thread.id, {
                    assistant_id: this.assistantId
                });
                this.activeRuns[thread.id] = run.id;
                const response = await this.waitForRunCompletion(thread.id, run.id);
                delete this.activeRuns[thread.id];
                return response;
            }
            return {
                sessionId,
                reply: null
            };
        }
        catch (error) {
            this.logger.error('Error starting chat:', error);
            throw new Error('Failed to start chat session');
        }
    }
    async waitForRunCompletion(threadId, runId) {
        try {
            let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
            while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
            }
            if (runStatus.status === 'requires_action') {
                const toolOutputs = await this.handleFunctionCalls(threadId, runId, runStatus);
                await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
                    tool_outputs: toolOutputs
                });
                return await this.waitForRunCompletion(threadId, runId);
            }
            const messages = await this.openai.beta.threads.messages.list(threadId);
            const lastMessage = messages.data[0];
            const responseText = this.getMessageText(lastMessage.content);
            return {
                sessionId: Object.keys(this.threads).find(key => this.threads[key] === threadId),
                reply: responseText
            };
        }
        catch (error) {
            this.logger.error('Error waiting for run completion:', error);
            throw error;
        }
    }
    formatBookingForChat(booking) {
        return `📋 **Booking Details**
👤 **Name:** ${booking.name}
📞 **Phone:** ${booking.phone}
📍 **Pickup:** ${booking.pickupLocation}
➡️ **Destination:** ${booking.destination}
🕓 **Pickup Time:** ${booking.pickupTime}
🎫 **Booking ID:** ${booking._id}`;
    }
    async sendMessage(sessionId, message) {
        try {
            if (!this.threads[sessionId]) {
                throw new Error('Chat session not found');
            }
            const threadId = this.threads[sessionId];
            if (this.activeRuns[threadId]) {
                this.logger.log(`Waiting for previous run ${this.activeRuns[threadId]} to complete...`);
                await this.waitForRunCompletion(threadId, this.activeRuns[threadId]);
            }
            await this.openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: message
            });
            const run = await this.openai.beta.threads.runs.create(threadId, {
                assistant_id: this.assistantId
            });
            this.activeRuns[threadId] = run.id;
            const response = await this.waitForRunCompletion(threadId, run.id);
            delete this.activeRuns[threadId];
            return response;
        }
        catch (error) {
            this.logger.error('Error in chat:', error);
            throw new Error('Failed to process message');
        }
    }
    async handleFunctionCalls(threadId, runId, runStatus) {
        const toolOutputs = [];
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        for (const toolCall of toolCalls) {
            if (toolCall.function.name === 'get_booking') {
                try {
                    const { bookingId } = JSON.parse(toolCall.function.arguments);
                    const booking = await this.bookingModel.findById(bookingId).exec();
                    if (!booking) {
                        toolOutputs.push({
                            tool_call_id: toolCall.id,
                            output: JSON.stringify({
                                success: false,
                                error: 'Booking not found'
                            })
                        });
                    }
                    else {
                        toolOutputs.push({
                            tool_call_id: toolCall.id,
                            output: JSON.stringify({
                                success: true,
                                booking: {
                                    name: booking.name,
                                    phone: booking.phone,
                                    pickupLocation: booking.pickupLocation,
                                    destination: booking.destination,
                                    pickupTime: booking.pickupTime,
                                    bookingId: booking._id
                                }
                            })
                        });
                    }
                }
                catch (error) {
                    this.logger.error('Error fetching booking:', error);
                    toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: JSON.stringify({
                            success: false,
                            error: 'Failed to fetch booking details'
                        })
                    });
                }
            }
            else if (toolCall.function.name === 'parse_date') {
                toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify({
                        success: false,
                        message: `Date parsing is currently disabled.`
                    })
                });
            }
            else if (toolCall.function.name === 'save_booking') {
                const sessionId = Object.keys(this.threads).find(key => this.threads[key] === threadId);
                if (!this.bookingSaved[sessionId]) {
                    const bookingData = JSON.parse(toolCall.function.arguments);
                    const booking = new this.bookingModel(bookingData);
                    const savedBooking = await booking.save();
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
        }
        return toolOutputs;
    }
    async getAllBookings() {
        try {
            return await this.bookingModel.find().sort({ createdAt: -1 }).exec();
        }
        catch (error) {
            this.logger.error('Error fetching bookings:', error);
            throw new Error('Failed to fetch bookings');
        }
    }
    async getBookingById(bookingId) {
        try {
            const booking = await this.bookingModel.findById(bookingId).exec();
            if (!booking) {
                throw new Error('Booking not found');
            }
            return booking;
        }
        catch (error) {
            this.logger.error(`Error fetching booking with ID ${bookingId}:`, error);
            throw new Error('Failed to fetch booking');
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
        }
        catch (error) {
            this.logger.error('❌ Test booking failed:', error);
            throw error;
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ChatService);
//# sourceMappingURL=chat.service.js.map