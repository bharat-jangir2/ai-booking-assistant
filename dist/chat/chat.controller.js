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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async startChat(body, res) {
        try {
            const result = await this.chatService.startChat(body.sessionId);
            res.json(result);
        }
        catch (error) {
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: error.message || 'Failed to start chat session'
            });
        }
    }
    async sendMessage(body, res) {
        try {
            const result = await this.chatService.sendMessage(body.sessionId, body.message);
            res.json(result);
        }
        catch (error) {
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: error.message || 'Failed to process message'
            });
        }
    }
    async getAllBookings(res) {
        try {
            const bookings = await this.chatService.getAllBookings();
            res.json(bookings);
        }
        catch (error) {
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: error.message || 'Failed to fetch bookings'
            });
        }
    }
    async testBooking(res) {
        try {
            const result = await this.chatService.testBooking();
            res.json(result);
        }
        catch (error) {
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message,
                stack: error.stack
            });
        }
    }
    async healthCheck(res) {
        res.json({
            status: 'OK',
            message: 'Car Booking Chatbot is running!'
        });
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('start'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "startChat", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('bookings'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getAllBookings", null);
__decorate([
    (0, common_1.Post)('test-booking'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "testBooking", null);
__decorate([
    (0, common_1.Get)('health'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "healthCheck", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map