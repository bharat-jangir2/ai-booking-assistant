import { Response } from 'express';
import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    startChat(body: {
        sessionId: string;
    }, res: Response): Promise<void>;
    sendMessage(body: {
        sessionId: string;
        message: string;
    }, res: Response): Promise<void>;
    getAllBookings(res: Response): Promise<void>;
    getBookingById(id: string, res: Response): Promise<void>;
    getBookingsByPhone(phone: string, res: Response): Promise<void>;
    testBooking(res: Response): Promise<void>;
    testMultipleBookings(res: Response): Promise<void>;
    healthCheck(res: Response): Promise<void>;
}
