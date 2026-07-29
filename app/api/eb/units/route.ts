import { NextResponse } from 'next/server';
import { setRelayStatus } from '@/lib/tuya';
import { sendWhatsAppAlert, formatWhatsAppNumber } from '@/lib/twilioEB';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true, isDeleted: false }
    });

    const meters = await prisma.ebMeter.findMany({
      orderBy: [{ house: 'asc' }, { name: 'asc' }]
    });

    const enrichedUnits = meters.map(unit => {
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
        tenantName: matchedTenant ? matchedTenant.name.split(' ')[0] : null
      };
    });

    return NextResponse.json(enrichedUnits);
  } catch (error) {
    console.error('Error fetching EB meters:', error);
    return NextResponse.json({ error: 'Failed to fetch meters' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, rechargeAmountRs } = body;

    const unit = await prisma.ebMeter.findUnique({
      where: { id }
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    const RATE_PER_UNIT = 8.5; // Rs 8.5 per kWh
    const rechargeKwh = parseFloat(rechargeAmountRs) / RATE_PER_UNIT;

    // Update balance
    let newBalance = unit.balance + rechargeKwh;
    let newStatus = unit.status;
    let newBypassTimestamp = unit.bypassTimestamp;
    
    // If balance is now > 0 and was offline or in maintenance, turn it online and switch Tuya relay ON
    if (newBalance > 0 && (unit.status === 'offline' || unit.status === 'maintenance')) {
      newStatus = 'online';
      newBypassTimestamp = null;
      await setRelayStatus(unit.deviceId, true);
    }

    const updatedUnit = await prisma.ebMeter.update({
      where: { id },
      data: {
        balance: newBalance,
        status: newStatus,
        bypassTimestamp: newBypassTimestamp
      }
    });

    // Send WhatsApp confirmation
    const message = `⚡ *KirayaEB Recharge Successful*\nRs ${rechargeAmountRs} added to ${unit.house} - ${unit.name}.\nNew Balance: ${newBalance.toFixed(2)} kWh`;
    
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

    const phoneNumberToAlert = formatWhatsAppNumber(matchedTenant?.phone || unit.phoneNumber);

    if (phoneNumberToAlert) {
      await sendWhatsAppAlert(phoneNumberToAlert, message);
    }

    return NextResponse.json({ success: true, unit: updatedUnit });
  } catch (error) {
    console.error('Recharge error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
