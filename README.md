# 🚗 Car Booking Chatbot with OpenAI Assistant

A NestJS-based car booking chatbot that uses OpenAI Assistant to collect booking information step-by-step and saves it to MongoDB.

## ✨ Features

- 🤖 **OpenAI Assistant Integration** - Intelligent conversation handling
- 📝 **Step-by-step Data Collection** - Collects name, phone, pickup location, destination, and time
- 💾 **MongoDB Storage** - Saves all bookings to database
- ✅ **Booking Confirmation** - Sends detailed booking summary
- 🎨 **Modern Web UI** - Beautiful chat interface
- 🔧 **NestJS Architecture** - Scalable and maintainable codebase

## 🛠️ Tech Stack

- **Backend**: NestJS, TypeScript
- **Database**: MongoDB with Mongoose
- **AI**: OpenAI Assistant API
- **Frontend**: HTML, CSS, JavaScript
- **Environment**: Node.js

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- OpenAI API key

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-chatbot-openai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   MONGODB_URI=mongodb://127.0.0.1:27017/car_booking_db
   PORT=3000
   ```

4. **Start the development server**
   ```bash
   npm run start:dev
   ```

## 🌐 Usage

1. **Access the chat interface**
   - Open your browser and go to `http://localhost:3000`

2. **Start a booking**
   - The chatbot will greet you and start collecting information
   - Follow the prompts to provide your booking details

3. **Complete the booking**
   - Once all information is collected, your booking will be confirmed
   - You'll receive a booking ID and summary

## 📡 API Endpoints

- `GET /` - Chat UI interface
- `POST /api/start` - Start a new chat session
- `POST /api/chat` - Send/receive chat messages
- `GET /api/bookings` - Get all bookings
- `POST /api/test-booking` - Test booking creation
- `GET /api/health` - Health check

## 🏗️ Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module configuration
├── app.controller.ts      # Static file serving
├── chat/
│   ├── chat.controller.ts # HTTP endpoints
│   └── chat.service.ts    # Business logic
└── schemas/
    └── booking.schema.ts  # MongoDB schema
public/
└── index.html            # Chat UI
```

## 🔧 Development

### Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run start:prod` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/car_booking_db` |
| `PORT` | Server port | `3000` |

## 🧪 Testing

1. **Test MongoDB connection**
   ```bash
   curl -X POST http://localhost:3000/api/test-booking
   ```

2. **View all bookings**
   ```bash
   curl http://localhost:3000/api/bookings
   ```

3. **Health check**
   ```bash
   curl http://localhost:3000/api/health
   ```

## 📊 Database Schema

The booking schema includes:
- `name` (string) - Customer's full name
- `phone` (string) - Mobile number
- `pickupLocation` (string) - Pickup address
- `destination` (string) - Destination address
- `pickupTime` (string) - Pickup date and time
- `createdAt` (Date) - Booking creation timestamp

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify your environment variables are set correctly
3. Ensure MongoDB is running
4. Check your OpenAI API key is valid

## 🔄 Migration from Express.js

This project was migrated from Express.js to NestJS. The functionality remains exactly the same, but now benefits from:
- Better TypeScript support
- Dependency injection
- Modular architecture
- Built-in validation
- Enhanced error handling
- Better testing capabilities 