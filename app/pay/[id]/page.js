import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import MarkPaidButton from './MarkPaidButton'
import QRDisplay from './QRDisplay'

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
  
  // Standard universal UPI link (used for QR code and iOS fallback)
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Landlord&am=${invoice.amountDue}&cu=INR`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`

  // Explicit Android Intent URLs to bypass WhatsApp/Instagram WebView blocking
  const phonePeIntent = `intent://pay?pa=${UPI_ID}&pn=Landlord&am=${invoice.amountDue}&cu=INR#Intent;scheme=upi;package=com.phonepe.app;end`;
  const gpayIntent = `intent://pay?pa=${UPI_ID}&pn=Landlord&am=${invoice.amountDue}&cu=INR#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
  const paytmIntent = `intent://pay?pa=${UPI_ID}&pn=Landlord&am=${invoice.amountDue}&cu=INR#Intent;scheme=upi;package=net.one97.paytm;end`;

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

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 'bold' }}>Pay Instantly (Android Only):</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <a href={phonePeIntent} className="btn" style={{ backgroundColor: '#5f259f', color: 'white', padding: '0.8rem', fontSize: '0.95rem', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                  PhonePe
                </a>
                <a href={gpayIntent} className="btn" style={{ backgroundColor: '#ffffff', color: '#3c4043', border: '1px solid #dadce0', padding: '0.8rem', fontSize: '0.95rem', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                  GPay
                </a>
                <a href={paytmIntent} className="btn" style={{ backgroundColor: '#00baf2', color: 'white', padding: '0.8rem', fontSize: '0.95rem', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', gridColumn: 'span 2' }}>
                  Paytm
                </a>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid var(--warning-color)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', textAlign: 'left', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.2rem', marginTop: '-2px' }}>💡</div>
              <div>
                <h3 style={{ color: 'var(--warning-color)', fontSize: '0.85rem', margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>iPhone Users / Fallback</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0', lineHeight: '1.3' }}>
                  If the buttons above fail, simply download the QR code above and select it from your gallery inside your UPI app's scanner!
                </p>
              </div>
            </div>
            
            <MarkPaidButton invoiceId={invoice.id} />
          </>
        )}
      </div>
    </main>
  )
}
