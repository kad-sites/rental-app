import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unitsDB } from '@/lib/eb-db'
import { setRelayStatus } from '@/lib/tuya'

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const tenantId = parseInt(id)
    if (isNaN(tenantId)) {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 })
    }

    // Get the tenant and their pending invoices
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        invoices: {
          where: { status: { in: ['PENDING', 'VERIFYING'] } }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Calculate total unpaid dues
    const unpaidDues = tenant.invoices.reduce((sum, inv) => sum + inv.amountDue, 0)

    // Mark all pending invoices as PAID (deducted from deposit)
    if (tenant.invoices.length > 0) {
      const invoiceIds = tenant.invoices.map(inv => inv.id)
      await prisma.invoice.updateMany({
        where: { id: { in: invoiceIds } },
        data: { status: 'PAID' } // Using deposit to settle them
      })
    }

    // Mark the tenant as inactive
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false }
    })

    // Automatically disconnect the EB meter for this vacated tenant
    if (updatedTenant.houseNo && updatedTenant.unitNo) {
      const tenantHouseNum = updatedTenant.houseNo.replace(/\D/g, '');
      const tenantUnitNum = updatedTenant.unitNo.replace(/\D/g, '');

      const meter = unitsDB.find(u => {
        const uHouseNum = u.house.replace(/\D/g, '');
        const uUnitNum = u.name.replace(/\D/g, '');
        return uHouseNum === tenantHouseNum && uUnitNum === tenantUnitNum;
      });

      if (meter && meter.status !== 'offline') {
        meter.status = 'offline';
        // Fire Tuya API to cut power (no WhatsApp alert for the client)
        await setRelayStatus(meter.deviceId, false).catch(e => console.error('Tuya disconnect failed on vacate', e));
      }
    }

    return NextResponse.json({ 
      success: true, 
      settledDues: unpaidDues,
      tenant: updatedTenant 
    })
  } catch (error) {
    console.error('Failed to vacate tenant:', error)
    return NextResponse.json({ error: 'Failed to vacate tenant' }, { status: 500 })
  }
}
