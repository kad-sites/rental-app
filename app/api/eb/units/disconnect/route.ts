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

    // Check if already offline
    if (unit.status === 'offline') {
       return NextResponse.json({ success: true, message: 'Already disconnected', unit });
    }

    // Force disconnect
    const updatedUnit = await prisma.ebMeter.update({
      where: { id },
      data: {
        status: 'offline'
      }
    });
    
    // Trigger Tuya to turn OFF the MCB
    await setRelayStatus(unit.deviceId, false);

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
        `🚨 *Electricity Disconnected*\nYour meter for ${unit.house} - ${unit.name} has been manually disconnected by the landlord.\nPlease contact Aziz Rentals for assistance.`
      );
    }

    return NextResponse.json({ success: true, unit: updatedUnit });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
