import twilio from 'twilio';

// Use environment variables for production, dummy values for now
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'AC_dummy_account_sid';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'dummy_auth_token';
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'; // Default Twilio sandbox number

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Sends a WhatsApp message to the tenant.
 * Uses dummy console.log if keys are not set.
 */
export async function sendWhatsAppAlert(toPhoneNumber: string, messageBody: string): Promise<boolean> {
  if (TWILIO_ACCOUNT_SID.includes('dummy')) {
    // Mock logic
    console.log(`\n[TWILIO MOCK] 🟢 WhatsApp Message to ${toPhoneNumber}:`);
    console.log(`"${messageBody}"\n`);
    return true;
  }

  try {
    // Format phone number with whatsapp: prefix required by Twilio
    const formattedTo = toPhoneNumber.startsWith('whatsapp:') ? toPhoneNumber : `whatsapp:${toPhoneNumber}`;
    const formattedFrom = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') ? TWILIO_WHATSAPP_NUMBER : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

    const message = await client.messages.create({
      body: messageBody,
      from: formattedFrom,
      to: formattedTo
    });

    console.log(`[TWILIO] Message sent successfully. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error(`[TWILIO] Error sending WhatsApp message:`, error);
    return false;
  }
}
