import { NextResponse } from 'next/server';
import { getEnergyReading, setRelayStatus } from '@/lib/tuya';
import { sendWhatsAppAlert } from '@/lib/twilioEB';
import { prisma } from '@/lib/prisma';

/**
 * This endpoint simulates a background cron job.
 * In a real app, this might be triggered by a Cron service (like Vercel Cron or a setInterval in a custom Node server).
 */
export async function GET() {
  console.log('🔄 Running Background Energy Sync...');

  try {
    const meters = await prisma.ebMeter.findMany();
    const updates = [];

    for (const unit of meters) {
    if (unit.status === 'offline') {
      // Skip if already cut off
      continue;
    }
    
    if (unit.status === 'maintenance') {
      // Send reminder to landlord every 12 hours (43200000 ms)
      const now = Date.now();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      if (unit.bypassTimestamp && (now - Number(unit.bypassTimestamp)) >= TWELVE_HOURS) {
        if (unit.phoneNumber) {
          await sendWhatsAppAlert(
            unit.phoneNumber, // Note: In production this would be the Landlord's actual number
            `🔔 *Landlord Reminder*\nThe power for ${unit.house} - ${unit.name} has been in MAINTENANCE Bypass Mode for over 12 hours.`
          );
        }
        // Reset timestamp so we remind again in another 12 hours
        unit.bypassTimestamp = BigInt(now);
      }
      continue; // Skip balance deduction while in maintenance
    }

    // 1. Fetch real-time consumption from Tuya
    const consumedKwh = await getEnergyReading(unit.deviceId);
    
    if (consumedKwh > 0) {
      // 2. Deduct from balance and add to lifetime consumption
      let newBalance = unit.balance - consumedKwh;
      let newTotalConsumed = unit.totalConsumed + consumedKwh;

      // Ensure balance doesn't show crazy decimals
      newBalance = Number(newBalance.toFixed(2));
      newTotalConsumed = Number(newTotalConsumed.toFixed(2));

      let newStatus = unit.status;

      // 3. Logic: Check for Warnings and Cutoffs
      if (newBalance <= 0) {
        // CUTOFF CONDITION
        newBalance = 0;
        newStatus = 'offline';
        
        // Command Tuya to physically turn off the MCB
        await setRelayStatus(unit.deviceId, false);
        
        // Notify tenant via Twilio WhatsApp
        if (unit.phoneNumber) {
          await sendWhatsAppAlert(
            unit.phoneNumber, 
            `🚨 *URGENT: Power Disconnected*\nYour KirayaEB smart meter for ${unit.house} - ${unit.name} has run out of balance.\nPlease recharge immediately to restore power automatically.`
          );
        }
      } else if (newBalance < 5 && unit.balance >= 5) {
        // WARNING CONDITION (e.g., just crossed below 5 kWh)
        if (unit.phoneNumber) {
          await sendWhatsAppAlert(
            unit.phoneNumber, 
            `⚠️ *Low Balance Warning*\nYour KirayaEB smart meter for ${unit.house} - ${unit.name} has dropped below 5 kWh.\nAvailable Balance: ${newBalance.toFixed(2)} kWh.\nPlease recharge soon to avoid disconnection.`
          );
        }
      }
      
      const updatedUnit = await prisma.ebMeter.update({
        where: { id: unit.id },
        data: {
          balance: newBalance,
          totalConsumed: newTotalConsumed,
          status: newStatus,
          bypassTimestamp: unit.bypassTimestamp
        }
      });

      updates.push({ id: unit.id, consumed: consumedKwh, newBalance: updatedUnit.balance });
    }
  }

  return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
