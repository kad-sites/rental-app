import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import MarkPaidButton from './MarkPaidButton'

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
  const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'your-upi-id-here@bank';
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Landlord&am=${invoice.amountDue}&cu=INR`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`

  return (
    <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem 0' }}>Rent Payment</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>For {invoice.tenant?.name || 'Tenant'}</p>
        
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>
          ₹{invoice.amountDue.toLocaleString('en-IN', {minimumFractionDigits: 2})}
        </div>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Rent
        </p>

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              <a href={`phonepe://pay?pa=${UPI_ID}&pn=Landlord&am=${invoice.amountDue}&cu=INR`} className="btn" style={{ backgroundColor: '#5f259f', color: 'white', padding: '0.6rem', fontSize: '0.9rem', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                PhonePe
              </a>
              <a href={`gpay://upi/pay?pa=${UPI_ID}&pn=Landlord&am=${invoice.amountDue}&cu=INR`} className="btn" style={{ backgroundColor: '#ffffff', color: '#3c4043', border: '1px solid #dadce0', padding: '0.6rem', fontSize: '0.9rem', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                GPay
              </a>
              <a href={`paytmmp://pay?pa=${UPI_ID}&pn=Landlord&am=${invoice.amountDue}&cu=INR`} className="btn" style={{ backgroundColor: '#00baf2', color: 'white', padding: '0.6rem', fontSize: '0.9rem', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                Paytm
              </a>
              <a href={upiUrl} className="btn btn-success" style={{ padding: '0.6rem', fontSize: '0.9rem', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                Other UPI
              </a>
            </div>
            
            <MarkPaidButton invoiceId={invoice.id} />

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Or scan QR from another phone:</p>
              <img 
                src={qrUrl} 
                alt="UPI QR Code" 
                style={{ 
                  borderRadius: '8px', 
                  border: '3px solid white', 
                  width: '150px', 
                  height: '150px', 
                  margin: '0 auto' 
                }} 
              />
            </div>
          </>
        )}
      </div>
    </main>
  )
}
