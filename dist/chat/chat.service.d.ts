import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../schemas/booking.schema';
export declare class ChatService {
    private bookingModel;
    private readonly logger;
    private openai;
    private assistantId;
    private threads;
    private bookingSaved;
    private savedBookings;
    constructor(bookingModel: Model<BookingDocument>);
    private initializeAssistant;
    private getMessageText;
    startChat(sessionId: string): Promise<{
        sessionId: string;
        reply: string;
    }>;
    sendMessage(sessionId: string, message: string): Promise<{
        sessionId: string;
        reply: string;
        error: boolean;
        bookingComplete?: undefined;
        bookingId?: undefined;
    } | {
        sessionId: string;
        reply: string;
        bookingComplete: boolean;
        bookingId: any;
        error?: undefined;
    } | {
        sessionId: string;
        reply: string;
        error?: undefined;
        bookingComplete?: undefined;
        bookingId?: undefined;
    }>;
    getAllBookings(): Promise<(import("mongoose").Document<unknown, {}, BookingDocument, {}> & Booking & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    testBooking(): Promise<{
        success: boolean;
        message: string;
        bookingId: unknown;
        booking: import("mongoose").Document<unknown, {}, BookingDocument, {}> & Booking & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
    }>;
}
