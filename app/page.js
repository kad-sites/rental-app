export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import DashboardClient from './components/DashboardClient'

export default async function Dashboard() {
  // Fetch full lists for the interactive dashboard in PARALLEL for maximum speed
  const [activeTenants, pendingInvoices, totalDepositObj] = await Promise.all([
    prisma.tenant.findMany({
      where: { isActive: true, isDeleted: false },
      include: {
        invoices: {
          where: {
            status: { in: ['PENDING', 'VERIFYING'] }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.invoice.findMany({
      where: { 
        status: { in: ['PENDING', 'VERIFYING'] } 
      },
      include: { tenant: true },
      orderBy: { dueDate: 'asc' }
    }),
    prisma.tenant.aggregate({
      _sum: { deposit: true },
      where: { isActive: true, isDeleted: false }
    })
  ]);
  
  const totalDeposit = totalDepositObj._sum.deposit || 0;

  return (
    <main className="container animate-fade-in">

      <DashboardClient 
        activeTenants={activeTenants} 
        pendingInvoices={pendingInvoices} 
        totalDeposit={totalDeposit} 
      />
    </main>
  )
}
