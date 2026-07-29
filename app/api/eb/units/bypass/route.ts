import { NextResponse } from 'next/server';
import { unitsDB } from '@/lib/eb-db';
import { setRelayStatus } from '@/lib/tuya';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    const unitIndex = unitsDB.findIndex(u => u.id === id);
    if (unitIndex === -1) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    const unit = unitsDB[unitIndex];

    if (unit.status === 'maintenance') {
      // Toggle off bypass
      unit.status = 'offline';
      unit.bypassTimestamp = undefined;
      
      // Trigger Tuya to turn OFF the MCB
      await setRelayStatus(unit.deviceId, false);
      
      return NextResponse.json({ success: true, message: 'Bypass disabled', unit });
    }

    // Check if already online
    if (unit.status === 'online') {
       return NextResponse.json({ error: 'Cannot bypass active meter' }, { status: 400 });
    }

    // Force bypass
    unit.status = 'maintenance';
    unit.bypassTimestamp = Date.now();
    
    // Trigger Tuya to turn ON the MCB for cleaning
    await setRelayStatus(unit.deviceId, true);

    return NextResponse.json({ success: true, unit });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
