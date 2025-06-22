import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚗 Car Booking Chatbot server running on port ${port}`);
  console.log(`🌐 Chat UI: http://localhost:${port}`);
  console.log(`📝 Health check: http://localhost:${port}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${port}/api/chat`);
}
bootstrap(); 