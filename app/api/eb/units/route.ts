import { NextResponse } from 'next/server';
import { unitsDB } from '@/lib/eb-db';
import { setRelayStatus } from '@/lib/tuya';
import { sendWhatsAppAlert } from '@/lib/twilioEB';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true, isDeleted: false }
    });

    const enrichedUnits = unitsDB.map(unit => {
      const unitHouseNum = unit.house.replace(/\D/g, '');
      const unitNum = unit.name.replace(/\D/g, '');

      const matchedTenant = tenants.find(t => {
        if (!t.houseNo || !t.unitNo) return false;
        const tenantHouseNum = t.houseNo.replace(/\D/g, '');
        const tenantUnitNum = t.unitNo.replace(/\D/g, '');
        return tenantHouseNum === unitHouseNum && tenantUnitNum === unitNum;
      });

      return {
        ...unit,
        tenantName: matchedTenant ? matchedTenant.name : null
      };
    });

    return NextResponse.json(enrichedUnits);
  } catch (error) {
    console.error('Error fetching tenants for EB:', error);
    return NextResponse.json(unitsDB);
  }
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
