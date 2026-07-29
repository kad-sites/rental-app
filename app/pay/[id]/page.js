import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import MarkPaidButton from './MarkPaidButton'
import QRDisplay from './QRDisplay'

export async function generateMetadata({ params }) {
  const { id } = await params;
  const invoiceId = parseInt(id)
  if (isNaN(invoiceId)) return { title: 'Invoice Not Found' };
  
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { tenant: true }
  })

  if (!invoice) return { title: 'Invoice Not Found' };

  const type = invoice.type === 'EB' ? 'Electricity Bill' : 'Rent Invoice';
  
  return {
    title: `${type} - ${invoice.tenant?.name || 'Tenant'}`,
    description: `Secure payment portal for ₹${invoice.amountDue.toLocaleString('en-IN')}`,
    openGraph: {
      title: `${type} - ${invoice.tenant?.name || 'Tenant'}`,
      description: `Secure payment portal for ₹${invoice.amountDue.toLocaleString('en-IN')}`,
      type: 'website',
    }
  }
}

export default async function PaymentPage({ params }) {
  const { id } = await params;
  const invoiceId = parseInt(id)
  
  if (isNaN(invoiceId)) {
    notFound()
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { tenant: true }
  })

  if (!invoice) {
    notFound()
  }

  // Read UPI ID from environment variables, fallback if missing
  const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'nazma.69256@okaxis';
  
  // Standard universal UPI link (used for QR code and iOS fallback). Restored amount parameter.
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=KirayaPay&am=${invoice.amountDue}&cu=INR`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`

  // Generate a unique filename for the downloaded QR code
  const rawTenantName = invoice.tenant?.name || 'Tenant';
  const safeTenantName = rawTenantName.replace(/[^a-zA-Z0-9]/g, '');
  const monthYear = new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(/\s+/g, '');
  const billType = invoice.type === 'EB' ? 'EB' : 'Rent';
  const downloadFileName = `QR_${billType}_${safeTenantName}_${monthYear}.png`;

  return (
    <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>
          {invoice.type === 'EB' ? 'Electricity Bill' : 'Rent Payment'} for {invoice.tenant?.name || 'Tenant'}
        </h1>
        
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          ₹{invoice.amountDue.toLocaleString('en-IN', {minimumFractionDigits: 2})}
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
            ({new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} {invoice.type === 'EB' ? 'Bill' : 'Rent'})
          </span>
        </div>

        {invoice.status === 'PAID' ? (
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--text-success)', borderRadius: '12px', color: 'var(--text-success)' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>✓ Payment Cleared</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This invoice has been marked as paid.</p>
          </div>
        ) : invoice.status === 'VERIFYING' ? (
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--warning-color)', borderRadius: '12px', color: 'var(--warning-color)' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>⏳ Verification Pending</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your landlord is verifying your payment.</p>
          </div>
        ) : (
          <>
            <QRDisplay qrUrl={qrUrl} fileName={downloadFileName} />

            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <a href={upiUrl} className="btn btn-success" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: 'bold', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                🚀 Pay Now using UPI App
              </a>
              <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                (Tap to open GPay, PhonePe, Paytm, etc.)
              </p>
            </div>
            
            <MarkPaidButton invoiceId={invoice.id} />
          </>
        )}
      </div>
    </main>
  )
}
