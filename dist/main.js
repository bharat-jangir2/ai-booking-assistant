"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    const port = process.env.PORT || 5000;
    await app.listen(port);
    console.log(`🚗 Car Booking Chatbot server running on port ${port}`);
    console.log(`🌐 Chat UI: http://localhost:${port}`);
    console.log(`📝 Health check: http://localhost:${port}/health`);
    console.log(`💬 Chat endpoint: http://localhost:${port}/api/chat`);
}
bootstrap();
//# sourceMappingURL=main.js.map