import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../schemas/booking.schema';
export declare class ChatService {
    private bookingModel;
    private readonly logger;
    private openai;
    private assistantId;
    private threads;
    private activeRuns;
    private bookingSaved;
    private savedBookings;
    constructor(bookingModel: Model<BookingDocument>);
    private initializeAssistant;
    private getMessageText;
    startChat(sessionId: string): Promise<any>;
    private waitForRunCompletion;
    private formatBookingForChat;
    sendMessage(sessionId: string, message: string): Promise<any>;
    private handleFunctionCalls;
    getAllBookings(): Promise<(import("mongoose").Document<unknown, {}, BookingDocument, {}> & Booking & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getBookingById(bookingId: string): Promise<import("mongoose").Document<unknown, {}, BookingDocument, {}> & Booking & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getBookingsByPhone(phone: string): Promise<(import("mongoose").Document<unknown, {}, BookingDocument, {}> & Booking & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
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
    testMultipleBookings(): Promise<{
        success: boolean;
        message: string;
        phone: string;
        count: number;
        bookings: any[];
    }>;
}
