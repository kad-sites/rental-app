import { NextResponse } from 'next/server';
import { setRelayStatus } from '@/lib/tuya';
import { prisma } from '@/lib/prisma';

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

    if (unit.status === 'maintenance') {
      // Toggle off bypass
      const updatedUnit = await prisma.ebMeter.update({
        where: { id },
        data: {
          status: 'offline',
          bypassTimestamp: null
        }
      });
      
      // Trigger Tuya to turn OFF the MCB
      await setRelayStatus(unit.deviceId, false);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Bypass disabled', 
        unit: {
          ...updatedUnit,
          bypassTimestamp: updatedUnit.bypassTimestamp ? Number(updatedUnit.bypassTimestamp) : null
        }
      });
    }

    // Check if already online
    if (unit.status === 'online') {
       return NextResponse.json({ error: 'Cannot bypass active meter' }, { status: 400 });
    }

    // Force bypass
    const updatedUnit = await prisma.ebMeter.update({
      where: { id },
      data: {
        status: 'maintenance',
        bypassTimestamp: BigInt(Date.now())
      }
    });
    
    // Trigger Tuya to turn ON the MCB for cleaning
    await setRelayStatus(unit.deviceId, true);

    return NextResponse.json({ 
      success: true, 
      unit: {
        ...updatedUnit,
        bypassTimestamp: updatedUnit.bypassTimestamp ? Number(updatedUnit.bypassTimestamp) : null
      }
    });
  } catch (error) {
    console.error('Bypass error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
