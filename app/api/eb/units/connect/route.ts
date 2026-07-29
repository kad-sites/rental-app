import { NextResponse } from 'next/server';
import { setRelayStatus } from '@/lib/tuya';
import { sendWhatsAppAlert } from '@/lib/twilioEB';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    const unit = await prisma.ebMeter.findUnique({
      where: { id }
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    // Check if already online
    if (unit.status === 'online') {
       return NextResponse.json({ success: true, message: 'Already connected', unit });
    }

    // Force connect and clear bypass
    const updatedUnit = await prisma.ebMeter.update({
      where: { id },
      data: {
        status: 'online',
        bypassTimestamp: null
      }
    });
    
    // Trigger Tuya to turn ON the MCB
    await setRelayStatus(unit.deviceId, true);

    // Fetch the real tenant's phone number from the database
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true, isDeleted: false }
    });

    const unitHouseNum = unit.house.replace(/\D/g, '');
    const unitNum = unit.name.replace(/\D/g, '');

    const matchedTenant = tenants.find(t => {
      if (!t.houseNo || !t.unitNo) return false;
      const tenantHouseNum = t.houseNo.replace(/\D/g, '');
      const tenantUnitNum = t.unitNo.replace(/\D/g, '');
      return tenantHouseNum === unitHouseNum && tenantUnitNum === unitNum;
    });

    const phoneNumberToAlert = matchedTenant?.phone ? `+91${matchedTenant.phone}` : unit.phoneNumber;

    // Send WhatsApp confirmation to tenant if they have a phone number
    if (phoneNumberToAlert) {
      await sendWhatsAppAlert(
        phoneNumberToAlert, 
        `✅ *Electricity Reconnected*\nYour meter for ${unit.house} - ${unit.name} has been manually connected by the landlord.\nBilling has resumed.`
      );
    }

    return NextResponse.json({ success: true, unit: updatedUnit });
  } catch (error) {
    console.error('Connect error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
