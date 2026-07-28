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
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Landlord&tr=RENT${invoice.id}&mc=0000&mode=02&purpose=00&am=${invoice.amountDue}&cu=INR`
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
            <div style={{ marginBottom: '1.5rem' }}>
              <a href={upiUrl} className="btn btn-success" style={{ display: 'block', padding: '1rem', fontSize: '1.1rem', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', width: '100%' }}>
                Pay instantly via GPay / Paytm
              </a>
              <div style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid var(--warning-color)', borderRadius: '8px', padding: '0.75rem', marginTop: '1rem', textAlign: 'left' }}>
                <p style={{ color: 'var(--warning-color)', fontSize: '0.85rem', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>🚨 PhonePe Users:</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  PhonePe blocks automatic web links. To use PhonePe without typing the amount, please <strong>Take a Screenshot</strong> of the QR code below, open PhonePe, tap the Scan icon, and select the screenshot from your gallery!
                </p>
              </div>
            </div>
            
            <MarkPaidButton invoiceId={invoice.id} />

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
              <p style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 'bold' }}>Scan to Pay</p>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem' }}>
                <img 
                  src={qrUrl} 
                  alt="UPI QR Code" 
                  style={{ 
                    display: 'block',
                    width: '200px', 
                    height: '200px', 
                    margin: '0 auto' 
                  }} 
                />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
