import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_URL = 'https://5c19-2405-201-5c03-685d-fd2d-a1a-e117-d641.ngrok-free.app/webhook';
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

async function testWebhookVerification() {
  try {
    console.log('🔍 Testing Webhook Verification...');
    
    const response = await axios.get(`${WEBHOOK_URL}`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': verifyToken,
        'hub.challenge': '123456'
      }
    });

    console.log('✅ Webhook verification successful!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Webhook verification failed:', error.response?.data || error.message);
    return false;
  }
}

async function testSendMessage() {
  try {
    console.log('📤 Testing sending a WhatsApp message...');
    
    const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: process.env.TEST_PHONE_NUMBER, // Add your WhatsApp number to .env
        type: 'text',
        text: {
          preview_url: false,
          body: '🤖 Hello! This is a test message from your Car Booking Assistant.'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Test message sent successfully!');
    console.log('Message ID:', response.data.messages[0].id);
    return true;
  } catch (error) {
    console.error('❌ Failed to send test message:', error.response?.data || error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting WhatsApp Integration Tests\n');
  
  console.log('Test 1: Webhook Verification');
  await testWebhookVerification();
  console.log('\n-------------------\n');
  
  console.log('Test 2: Send Test Message');
  await testSendMessage();
}

runTests(); 