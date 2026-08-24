import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const data = await request.json()
    const { tenantId, amount } = data;
    
    if (!tenantId || !amount || isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // 1. Create an invoice record to track the date of this deposit
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: parseInt(tenantId),
        amountDue: parseFloat(amount),
        type: 'DEPOSIT',
        status: 'PAID',
        dueDate: new Date(),
        whatsappSent: true, // prevent sending automatic rent reminders for this
      }
    });
    
    // 2. Update the tenant's actual deposit balance
    await prisma.tenant.update({
      where: { id: parseInt(tenantId) },
      data: { deposit: { increment: parseFloat(amount) } }
    });
    
    return NextResponse.json({ success: true, invoice })
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to record deposit' }, { status: 500 })
  }
}
