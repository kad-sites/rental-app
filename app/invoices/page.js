"use client"
import { useState, useEffect } from 'react'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sendingId, setSendingId] = useState(null)
  const [previewInvoice, setPreviewInvoice] = useState(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    const res = await fetch('/api/invoices')
    const data = await res.json()
    setInvoices(data)
    setLoading(false)
  }

  const handleGenerateAll = async () => {
    setGenerating(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // No tenantId means all
    })
    if (res.ok) {
      fetchInvoices()
    }
    setGenerating(false)
  }

  const handleSendWhatsApp = async (invoiceId) => {
    setSendingId(invoiceId)
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId })
    })
    
    const data = await res.json()
    if (res.ok) {
      alert('WhatsApp message sent successfully via Twilio!')
      fetchInvoices()
    } else {
      alert(`Twilio Error: ${data.error}`)
    }
    setSendingId(null)
  }

  const handleBulkSendWhatsApp = async () => {
    const pendingInvoices = invoices.filter(inv => !inv.whatsappSent && inv.status === 'PENDING')
    if (pendingInvoices.length === 0) {
      alert("No pending unsent invoices found!")
      return
    }
    
    if (!confirm(`Are you sure you want to send WhatsApp messages to ${pendingInvoices.length} tenants?`)) return;

    setGenerating(true)
    let successCount = 0;
    let failCount = 0;
    let lastError = "";

    for (const inv of pendingInvoices) {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: inv.id })
      })
      if (res.ok) {
        successCount++;
      } else {
        const data = await res.json();
        lastError = data.error;
        failCount++;
      }
    }
    
    fetchInvoices()
    setGenerating(false)
    if (failCount > 0) {
      alert(`Bulk Send Complete:\nSuccess: ${successCount}\nFailed: ${failCount}\nLast Error: ${lastError}`);
    } else {
      alert(`Successfully sent ${successCount} WhatsApp messages!`);
    }
  }

  const handleSendManual = async (inv) => {
    let phone = inv.tenant?.phone || '';
    if (!phone.startsWith('91') && !phone.startsWith('+')) {
      phone = '91' + phone;
    }
    phone = phone.replace('+', '');
    
    const baseUrl = window.location.origin;
    // Strip https:// to discourage WhatsApp from generating a link preview box
    let cleanBaseUrl = baseUrl.replace(/^https?:\/\//, '');
    let payUrl = `${cleanBaseUrl}/pay/${inv.id}`;
    
    const billType = inv.type === 'EB' ? 'electricity bill' : 'rent';
    const rawAmountStr = Number(inv.amountDue).toLocaleString('en-IN', {minimumFractionDigits: 2});
    const hiddenAmount = rawAmountStr.split('').join('\u200B'); // Defeat WhatsApp Pay regex
    const text = `Hello ${inv.tenant?.name},\n\nYour ${billType} for this month is ₹\u200B${hiddenAmount}.\nTo pay instantly or to view your QR code, click your secure invoice link below:\n${payUrl}\n\nThank you!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    
    // Mark as sent in DB
    await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: inv.id, manual: true })
    });
    fetchInvoices();
  }

  const handleSendReceipt = (inv) => {
    let phone = inv.tenant?.phone || '';
    if (!phone.startsWith('91') && !phone.startsWith('+')) {
      phone = '91' + phone;
    }
    phone = phone.replace('+', '');
    const billType = inv.type === 'EB' ? 'electricity bill' : 'rent';
    const text = `Hello ${inv.tenant?.name},\n\nYour payment for this month's ${billType} of ₹${inv.amountDue.toLocaleString('en-IN', {minimumFractionDigits: 2})} has been successfully received.\n\nThank you!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  }

  const handleMarkPaid = async (id, isVerifying = false) => {
    const msg = isVerifying 
      ? 'Are you sure you want to confirm this UPI payment and mark it as officially PAID?' 
      : 'Are you sure you want to mark this invoice as Paid in Cash?';
    if (!confirm(msg)) return;
    
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID' })
    })
    
    if (res.ok) {
      fetchInvoices()
    } else {
      alert('Failed to mark as paid')
    }
  }

  const handleRejectPayment = async (id) => {
    if (!confirm('Are you sure you want to reject this payment claim and set it back to Pending?')) return;
    
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PENDING' })
    })
    
    if (res.ok) {
      fetchInvoices()
    } else {
      alert('Failed to reject payment')
    }
  }

  const handleDeleteInvoice = async (id) => {
    if (!confirm('Are you sure you want to completely delete this invoice? This action cannot be undone.')) return;
    
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      fetchInvoices()
    } else {
      alert('Failed to delete invoice')
    }
  }

  return (
    <main className="container animate-fade-in">
      <div className="flex-between">
        <h1>Invoices & Billing (v1.1)</h1>
        <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <button 
            className="btn btn-outline" 
            onClick={handleBulkSendWhatsApp}
            disabled={generating}
            style={{borderColor: '#25D366', color: '#25D366'}}
          >
            {generating ? 'Sending...' : 'Bulk Send via Twilio'}
          </button>
          <button 
            className="btn btn-success" 
            onClick={handleGenerateAll}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Rent for All Tenants'}
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <h2 style={{marginTop: 0, marginBottom: '1.5rem'}}>Recent Invoices</h2>
        {loading ? <p>Loading...</p> : (
          <div style={{overflowX: 'auto'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TENANT</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>WHATSAPP</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>{inv.tenant?.name || 'Unknown'}</td>
                    <td>
                      ₹{inv.amountDue.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      {inv.type === 'EB' && <span className="eb-badge" style={{marginLeft: '8px', fontSize: '0.7rem', padding: '2px 5px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px'}}>⚡ EB</span>}
                    </td>
                    <td>
                      <span className={`badge ${inv.status === 'PAID' ? 'badge-paid' : inv.status === 'VERIFYING' ? 'badge-warning' : 'badge-pending'}`}>
                        {inv.status === 'PENDING' ? 'Pending' : inv.status === 'PAID' ? 'Paid' : 'Verifying'}
                      </span>
                    </td>
                    <td>
                      {inv.whatsappSent ? (
                        <span style={{color: 'var(--text-success)'}}>✓ Sent</span>
                      ) : (
                        <span style={{color: 'var(--text-secondary)'}}>Not Sent</span>
                      )}
                    </td>
                    <td style={{display: 'flex', gap: '0.5rem', whiteSpace: 'nowrap'}}>
                      {inv.status === 'PENDING' && (
                        <button 
                          className="btn btn-outline" 
                          style={{padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--text-success)', color: 'var(--text-success)'}}
                          onClick={() => handleMarkPaid(inv.id)}
                          title="Mark as paid in cash"
                        >
                          Cash Received
                        </button>
                      )}
                      {inv.status === 'VERIFYING' && (
                        <>
                          <button 
                            className="btn btn-success" 
                            style={{padding: '0.4rem 0.6rem', fontSize: '0.75rem'}}
                            onClick={() => handleMarkPaid(inv.id, true)}
                            title="Confirm you received the money"
                          >
                            Confirm Paid
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{padding: '0.4rem 0.6rem', fontSize: '0.75rem'}}
                            onClick={() => handleRejectPayment(inv.id)}
                            title="Reject claim and set to Pending"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {inv.status !== 'PAID' ? (
                        <>
                          <button 
                            className="btn btn-outline" 
                            style={{padding: '0.4rem 0.6rem', fontSize: '0.75rem'}}
                            onClick={() => setPreviewInvoice(inv)}
                          >
                            Preview
                          </button>

                          <button 
                            className="btn btn-outline" 
                            style={{padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderColor: '#25D366', color: '#25D366'}}
                            onClick={() => handleSendManual(inv)}
                            disabled={sendingId === inv.id}
                            title="Send silently in background via Twilio API"
                          >
                            {sendingId === inv.id ? '...' : 'WhatsApp'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="btn btn-outline" 
                            style={{padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderColor: '#25D366', color: '#25D366'}}
                            onClick={() => handleSendReceipt(inv)}
                            title="Send payment confirmation via WhatsApp"
                          >
                            WhatsApp Receipt
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--warning-color)', color: 'var(--warning-color)'}}
                            onClick={() => handleDeleteInvoice(inv.id)}
                            title="Permanently delete this invoice"
                          >
                            Delete Payment
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign: 'center', opacity: 0.5}}>No invoices generated yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewInvoice && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div className="glass-panel animate-fade-in" style={{maxWidth: '500px', width: '90%', position: 'relative'}}>
            <button onClick={() => setPreviewInvoice(null)} style={{position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer', padding: '0'}}>&times;</button>
            <h2 style={{marginTop: '0'}}>Message Preview</h2>
            <div style={{background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', whiteSpace: 'pre-wrap', border: '1px solid var(--border-color)'}}>
              {`Hello ${previewInvoice.tenant?.name},\n\nYour ${previewInvoice.type === 'EB' ? 'electricity bill' : 'rent'} for this month is ₹${Number(previewInvoice.amountDue).toLocaleString('en-IN', {minimumFractionDigits: 2})}.\nTo pay instantly or to view your QR code, click your secure invoice link below:\n${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/pay/${previewInvoice.id}\n\nThank you!`}
            </div>
            <div style={{textAlign: 'center'}}>
              <a href={`/pay/${previewInvoice.id}`} target="_blank" className="btn btn-success" style={{textDecoration: 'none', display: 'inline-block', padding: '0.5rem 1rem'}}>
                Test Payment Portal
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
