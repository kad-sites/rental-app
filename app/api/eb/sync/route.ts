import { NextResponse } from 'next/server';
import { unitsDB } from '@/lib/eb-db';
import { getEnergyReading, setRelayStatus } from '@/lib/tuya';
import { sendWhatsAppAlert } from '@/lib/twilioEB';

/**
 * This endpoint simulates a background cron job.
 * In a real app, this might be triggered by a Cron service (like Vercel Cron or a setInterval in a custom Node server).
 */
export async function GET() {
  console.log('🔄 Running Background Energy Sync...');

  const updates = [];

  for (const unit of unitsDB) {
    if (unit.status === 'offline') {
      // Skip if already cut off
      continue;
    }
    
    if (unit.status === 'maintenance') {
      // Send reminder to landlord every 12 hours (43200000 ms)
      const now = Date.now();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      if (unit.bypassTimestamp && (now - unit.bypassTimestamp) >= TWELVE_HOURS) {
        await sendWhatsAppAlert(
          '+919876543210', // Replace with actual Landlord phone number
          `🔔 *Landlord Reminder*\nThe power for ${unit.house} - ${unit.name} has been in MAINTENANCE Bypass Mode for over 12 hours.`
        );
        // Reset timestamp so we remind again in another 12 hours
        unit.bypassTimestamp = now;
      }
      continue; // Skip balance deduction while in maintenance
    }

    // 1. Fetch real-time consumption from Tuya
    const consumedKwh = await getEnergyReading(unit.deviceId);
    
    if (consumedKwh > 0) {
      const oldBalance = unit.balance;
      
      // 2. Deduct from balance and add to lifetime consumption
      unit.balance -= consumedKwh;
      unit.totalConsumed += consumedKwh;

      // Ensure balance doesn't show crazy decimals
      unit.balance = Number(unit.balance.toFixed(2));
      unit.totalConsumed = Number(unit.totalConsumed.toFixed(2));

      // 3. Logic: Check for Warnings and Cutoffs
      if (unit.balance <= 0) {
        // CUTOFF CONDITION
        unit.balance = 0;
        unit.status = 'offline';
        
        // Command Tuya to physically turn off the MCB
        await setRelayStatus(unit.deviceId, false);
        
        // Notify tenant via Twilio WhatsApp
        await sendWhatsAppAlert(
          unit.phoneNumber,
          `🚨 *CRITICAL ALERT*\nElectricity for ${unit.house} - ${unit.name} has been disconnected due to zero balance.\nPlease contact Aziz Rentals to recharge.`
        );
      } 
      else if (oldBalance >= 10 && unit.balance < 10) {
        // WARNING CONDITION (Only warn once when it crosses the 10 kWh threshold)
        await sendWhatsAppAlert(
          unit.phoneNumber,
          `⚠️ *Low Balance Warning*\nYour electricity balance for ${unit.house} - ${unit.name} has dropped to ${unit.balance} kWh.\nPlease recharge soon to avoid disconnection.`
        );
      }

      updates.push({
        id: unit.id,
        newBalance: unit.balance,
        status: unit.status,
        consumed: consumedKwh
      });
    }
  }

  return NextResponse.json({ success: true, updates });
}
