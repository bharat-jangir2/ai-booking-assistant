import { Document } from 'mongoose';
export type BookingDocument = Booking & Document;
export declare class Booking {
    name: string;
    phone: string;
    pickupLocation: string;
    destination: string;
    pickupTime: string;
    createdAt: Date;
}
export declare const BookingSchema: import("mongoose").Schema<Booking, import("mongoose").Model<Booking, any, any, any, Document<unknown, any, Booking, any> & Booking & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Booking, Document<unknown, {}, import("mongoose").FlatRecord<Booking>, {}> & import("mongoose").FlatRecord<Booking> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
