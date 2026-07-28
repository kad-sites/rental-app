import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; 
const UPI_ID = '919854469256@waaxis';

export async function POST(request) {
  try {
    const data = await request.json()
    const { invoiceId } = data
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: { tenant: true }
    })
    
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      
    if (data.manual) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { whatsappSent: true }
      })
      return NextResponse.json({ success: true, manual: true })
    }
    // Ensure phone has correct country code formatting for Twilio
    let phone = invoice.tenant.phone.trim();
    if (!phone.startsWith('+')) {
      if (phone.startsWith('91')) {
        phone = '+' + phone;
      } else {
        phone = '+91' + phone; 
      }
    }
    
    // Generate UPI URL
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Landlord&am=${invoice.amountDue}&cu=INR`
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`

    const baseUrl = request.headers.get('origin') || new URL(request.url).origin;
    const payUrl = `${baseUrl}/pay/${invoice.id}`;
    let messageSid;
    // Send message via Twilio
    if (accountSid && authToken && twilioPhoneNumber) {
      const client = twilio(accountSid, authToken)
      const msg = await client.messages.create({
        body: `Hello ${invoice.tenant.name},\n\nYour rent for this month is ₹${invoice.amountDue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}.\nTo pay instantly or to view your QR code, click your secure invoice link below:\n${payUrl}\n\nThank you!`,
        from: twilioPhoneNumber,
        to: `whatsapp:${phone}`,
        mediaUrl: [qrApiUrl]
      })
      messageSid = msg.sid
    } else {
      return NextResponse.json({ error: "Twilio credentials missing. Please add them to Vercel Environment Variables." }, { status: 500 })
    }

    // Mark invoice as sent
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { whatsappSent: true }
    })
    
    return NextResponse.json({ success: true, messageSid, qrUrl: qrApiUrl })
  } catch (error) {
    console.error("Twilio Error:", error)
    return NextResponse.json({ error: error.message || 'Failed to send WhatsApp message' }, { status: 500 })
  }
}
