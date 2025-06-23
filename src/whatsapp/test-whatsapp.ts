import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const whatsappApiVersion = 'v17.0';
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

async function testWhatsAppConfig() {
  try {
    console.log('🔍 Testing WhatsApp Configuration...');
    
    // Verify environment variables
    if (!phoneNumberId || !accessToken) {
      throw new Error('Missing required environment variables. Please check your .env file.');
    }

    // Test API access
    const url = `https://graph.facebook.com/${whatsappApiVersion}/${phoneNumberId}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✅ WhatsApp configuration is valid!');
    console.log('📱 Phone Number Details:', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing WhatsApp configuration:');
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('API Error:', {
          status: error.response.status,
          data: error.response.data
        });
      } else {
        console.error('Network Error:', error.message);
      }
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Run the test
testWhatsAppConfig(); 