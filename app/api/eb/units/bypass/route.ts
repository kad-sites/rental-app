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

    // Check if already in maintenance
    if (unit.status === 'maintenance') {
       return NextResponse.json({ success: true, message: 'Already in maintenance', unit });
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
