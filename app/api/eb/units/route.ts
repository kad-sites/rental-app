import { NextResponse } from 'next/server';
import { unitsDB } from '@/lib/eb-db';
import { setRelayStatus } from '@/lib/tuya';
import { sendWhatsAppAlert } from '@/lib/twilioEB';

export async function GET() {
  return NextResponse.json(unitsDB);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, rechargeAmountRs } = body;

    const unitIndex = unitsDB.findIndex(u => u.id === id);
    if (unitIndex === -1) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    const unit = unitsDB[unitIndex];

    const RATE_PER_UNIT = 8.5; // Rs 8.5 per kWh
    const rechargeKwh = parseFloat(rechargeAmountRs) / RATE_PER_UNIT;

    // Update balance
    unit.balance += rechargeKwh;
    
    // If balance is now > 0 and was offline, turn it online and switch Tuya relay ON
    if (unit.balance > 0 && unit.status === 'offline') {
      unit.status = 'online';
      
      // Trigger Tuya to turn ON the MCB
      await setRelayStatus(unit.deviceId, true);
    }

    // Send WhatsApp confirmation
    await sendWhatsAppAlert(
      unit.phoneNumber, 
      `✅ *Electricity Recharged*\nYour meter for ${unit.house} - ${unit.name} has been recharged with ₹${rechargeAmountRs} (${rechargeKwh.toFixed(2)} kWh).\nNew Balance: ${unit.balance.toFixed(2)} kWh.`
    );

    return NextResponse.json({ success: true, unit: unitsDB[unitIndex] });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
