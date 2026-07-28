import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    
    // Generate invoice for specific tenant or all active tenants
    if (data.tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } })
      if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          amountDue: tenant.rentAmount,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      })
      return NextResponse.json(invoice)
    }
    
    // If no tenantId, generate for active tenants only (Batch generation for the 1st of month)
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true, isDeleted: false }
    })
    const invoices = []
    for (const tenant of tenants) {
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          amountDue: tenant.rentAmount,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      })
      invoices.push(invoice)
    }
    return NextResponse.json({ message: `Generated ${invoices.length} invoices`, invoices })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate invoices' }, { status: 500 })
  }
}
