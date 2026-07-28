import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const data = await request.json()
    const { tenantId, currentReading } = data;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const current = parseFloat(currentReading);
    if (isNaN(current) || current < tenant.lastMeterReading) {
      return NextResponse.json({ error: 'Invalid meter reading. Must be greater than last reading.' }, { status: 400 })
    }

    const units = current - tenant.lastMeterReading;
    const amountDue = units * tenant.ebRate;

    // Create the EB invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        amountDue,
        type: 'EB',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    })

    // Update the tenant's last meter reading
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { lastMeterReading: current }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error generating EB bill:', error);
    return NextResponse.json({ error: 'Failed to generate EB bill' }, { status: 500 })
  }
}
