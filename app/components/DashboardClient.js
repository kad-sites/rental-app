"use client"
import { useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ClientInfoModal from './ClientInfoModal'

export default function DashboardClient({ activeTenants, pendingInvoices, totalDeposit }) {
  const [activeView, setActiveView] = useState(null) // 'tenants', 'deposits', 'pending'
  const [selectedClient, setSelectedClient] = useState(null)
  const router = useRouter()

  const pendingRentTotal = pendingInvoices.reduce((sum, inv) => sum + inv.amountDue, 0)

  // Group active tenants for the dashboard view
  const groupedActiveTenants = {};
  const activeHouseNumbers = [];
  
  activeTenants.forEach(t => {
    const house = t.houseNo || 'Unassigned';
    if (!groupedActiveTenants[house]) {
      groupedActiveTenants[house] = [];
      activeHouseNumbers.push(house);
    }
    groupedActiveTenants[house].push(t);
  });

  activeHouseNumbers.sort((a, b) => {
    if (a === 'Unassigned') return 1;
    if (b === 'Unassigned') return -1;
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  // Sort by unit number ascending within each house
  Object.keys(groupedActiveTenants).forEach(house => {
    groupedActiveTenants[house].sort((a, b) => {
      const unitA = parseInt(a.unitNo) || 0;
      const unitB = parseInt(b.unitNo) || 0;
      return unitA - unitB;
    });
  });

  const handleSendStrictReminder = (inv) => {
    let phone = inv.tenant?.phone || '';
    if (!phone) {
      alert("No phone number for this tenant.");
      return;
    }
    if (!phone.startsWith('91') && !phone.startsWith('+')) {
      phone = '91' + phone;
    }
    phone = phone.replace('+', '');
    
    const text = `Hello ${inv.tenant?.name},\n\nYour rent for this month (Rs. ${inv.amountDue.toLocaleString('en-IN', {minimumFractionDigits: 2})}) is currently PENDING.\n\nPlease pay at the earliest without any ifs and buts.\n\nPay here: ${window.location.origin}/pay/${inv.id}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

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
      router.refresh();
    } else {
      alert('Failed to mark as paid')
    }
  }

  const handleRejectPayment = async (inv) => {
    if (!confirm('Are you sure you want to reject this payment claim and set it back to Pending?')) return;
    
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PENDING' })
    })
    
    if (res.ok) {
      router.refresh();
      // Trigger WhatsApp notification for rejection
      let phone = inv.tenant?.phone || '';
      if (phone) {
        if (!phone.startsWith('91') && !phone.startsWith('+')) {
          phone = '91' + phone;
        }
        phone = phone.replace('+', '');
        
        const text = `Hello ${inv.tenant?.name},\n\nYour recent payment claim for Rs. ${inv.amountDue.toLocaleString('en-IN', {minimumFractionDigits: 2})} has been REJECTED as the funds were not received.\n\nYour invoice is still PENDING. Please complete the payment immediately.\n\nPay here: ${window.location.origin}/pay/${inv.id}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
      }
    } else {
      alert('Failed to reject payment')
    }
  }

  const [showCashModal, setShowCashModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group pending invoices by tenant for the modal
  const pendingByTenant = pendingInvoices.reduce((acc, inv) => {
    if (!acc[inv.tenantId]) {
      acc[inv.tenantId] = { tenant: inv.tenant, invoices: [] };
    }
    acc[inv.tenantId].invoices.push(inv);
    return acc;
  }, {});
  const tenantsWithPending = Object.values(pendingByTenant);

  const handleTenantSelect = (e) => {
    const tid = parseInt(e.target.value);
    setSelectedTenantId(tid);
    if (tid && pendingByTenant[tid]) {
      // Auto-select the oldest invoice (they are sorted by dueDate asc)
      setSelectedInvoiceId(pendingByTenant[tid].invoices[0].id);
    } else {
      setSelectedInvoiceId('');
    }
  };

  const handleGlobalMarkPaid = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    
    setIsSubmitting(true);
    const res = await fetch(`/api/invoices/${selectedInvoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID' })
    });
    
    setIsSubmitting(false);
    if (res.ok) {
      setShowCashModal(false);
      setSelectedTenantId('');
      setSelectedInvoiceId('');
      router.refresh();
    } else {
      alert('Failed to mark as paid');
    }
  };

  return (
    <>


      {showCashModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{width: '100%', maxWidth: '400px'}}>
            <h2 style={{color: '#fff', marginBottom: '1rem'}}>Record Cash Payment</h2>
            
            {tenantsWithPending.length === 0 ? (
              <p style={{color: 'var(--text-success)'}}>No pending invoices exist!</p>
            ) : (
              <form onSubmit={handleGlobalMarkPaid}>
                <div className="form-group full-width">
                  <label>Select Tenant</label>
                  <select 
                    className="form-control" 
                    value={selectedTenantId} 
                    onChange={handleTenantSelect}
                    required
                  >
                    <option value="">-- Choose Tenant --</option>
                    {tenantsWithPending.map(t => (
                      <option key={t.tenant.id} value={t.tenant.id}>
                        {t.tenant.name} ({t.invoices.length} pending)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTenantId && (
                  <div className="form-group full-width">
                    <label>Select Invoice</label>
                    <select 
                      className="form-control" 
                      value={selectedInvoiceId} 
                      onChange={(e) => setSelectedInvoiceId(e.target.value)}
                      required
                    >
                      {pendingByTenant[selectedTenantId]?.invoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          ₹{inv.amountDue.toLocaleString('en-IN')} - Due {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                        </option>
                      ))}
                    </select>
                    <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>
                      * The oldest pending invoice is selected by default.
                    </p>
                  </div>
                )}

                <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                  <button type="submit" className="btn btn-success" style={{flex: 1}} disabled={isSubmitting || !selectedInvoiceId}>
                    {isSubmitting ? 'Saving...' : 'Mark as Paid'}
                  </button>
                  <button type="button" className="btn btn-outline" style={{flex: 1}} onClick={() => setShowCashModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <div style={{marginBottom: '2rem'}}>
        <h1 style={{margin: '0 0 0.2rem 0'}}>Overview</h1>
        <p style={{color: 'var(--text-secondary)', margin: 0}}>Your properties at a glance.</p>
      </div>

      <div className="dashboard-grid-app">
        {/* Tenants Card */}
        <div 
          className={`stat-card-app card-tenants ${activeView === 'tenants' ? 'active' : ''}`}
          style={{cursor: 'pointer'}}
          onClick={() => setActiveView(activeView === 'tenants' ? null : 'tenants')}
        >
          <svg className="watermark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <div>
            <div className="top-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span className="stat-label">ACTIVE TENANTS</span>
            </div>
            <div className="stat-value">{activeTenants.length}</div>
          </div>
        </div>
        
        {/* Due Rent Card */}
        <div 
          className={`stat-card-app card-rent ${activeView === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveView(activeView === 'pending' ? null : 'pending')}
          style={{cursor: 'pointer'}}
        >
          <svg className="watermark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <div>
            <div className="top-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span className="stat-label">DUE RENT</span>
            </div>
            <div className="stat-value" style={{color: 'var(--warning-text)'}}>
              ₹{(pendingRentTotal / 1000).toFixed(1)}K
            </div>
          </div>
        </div>

        {/* Deposits Escrow Card */}
        <div 
          className={`stat-card-app card-deposits ${activeView === 'deposits' ? 'active' : ''}`}
          style={{cursor: 'pointer'}}
          onClick={() => setActiveView(activeView === 'deposits' ? null : 'deposits')}
        >
          <svg className="watermark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12" />
            <path d="M6 8h12" />
            <path d="M6 13h8.5a4.5 4.5 0 0 0 0-9" />
            <path d="M10 13l5 8" />
          </svg>
          <div>
            <div className="top-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12" />
                <path d="M6 8h12" />
                <path d="M6 13h8.5a4.5 4.5 0 0 0 0-9" />
                <path d="M10 13l5 8" />
              </svg>
              <span className="stat-label">DEPOSITS / SECURITY</span>
            </div>
            <div className="stat-value">
              ₹{(totalDeposit / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Drill-down Views */}
      {activeView === 'tenants' && (
        <div className="glass-panel animate-fade-in" style={{marginBottom: '2rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h2 style={{margin: 0}}>Active Tenants List</h2>
            <button className="btn btn-success hide-on-desktop" style={{padding: '0.4rem 0.8rem', fontSize: '0.85rem'}} onClick={() => setShowCashModal(true)}>💰 Cash Entry</button>
          </div>
          <div style={{overflowX: 'auto', overflowY: 'auto', maxHeight: '50vh'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Name</th>
                  <th>WhatsApp Phone</th>
                  <th>Documents</th>
                  <th>Deposit</th>
                </tr>
              </thead>
              <tbody>
                {activeTenants.length === 0 ? (
                  <tr><td colSpan="5" style={{textAlign: 'center'}}>No active tenants found.</td></tr>
                ) : (
                  activeHouseNumbers.map(house => (
                    <Fragment key={house}>
                      <tr>
                        <td colSpan="5" style={{backgroundColor: 'transparent', border: 'none', padding: '1rem 0.5rem 0.25rem 0.5rem'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                            <div style={{color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap'}}>
                              🏡 HOUSE {house === 'Unassigned' ? 'UNASSIGNED' : house}
                            </div>
                            <div style={{flex: 1, height: '1px', borderBottom: '1px dashed rgba(255,255,255,0.15)'}}></div>
                          </div>
                        </td>
                      </tr>
                      {groupedActiveTenants[house].map(t => (
                        <tr key={t.id}>
                          <td>
                            <div style={{fontWeight: '450', color: 'var(--text-primary)'}}>Unit {t.unitNo || '-'}</div>
                          </td>
                          <td>
                            <span 
                              className="client-name-link"
                              onClick={() => setSelectedClient(t)}
                              style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}
                            >
                              {t.name}
                              {t.invoices?.filter(i => new Date(i.dueDate) < new Date()).length > 0 && (
                                <svg 
                                  className={t.invoices.filter(i => new Date(i.dueDate) < new Date()).length >= 3 ? 'bulb-red' : t.invoices.filter(i => new Date(i.dueDate) < new Date()).length === 2 ? 'bulb-orange' : 'bulb-yellow'} 
                                  width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                                  style={{flexShrink: 0}}
                                >
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 17.5c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2z"/>
                                </svg>
                              )}
                            </span>
                          </td>
                          <td>+{t.phone}</td>
                          <td>
                            <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '6px', alignItems: 'center'}}>
                              {t.aadharUrl && <a href={t.aadharUrl} target="_blank" rel="noreferrer" className="doc-badge">Aadhar</a>}
                              {t.passportUrl && <a href={t.passportUrl} target="_blank" rel="noreferrer" className="doc-badge">Passport</a>}
                              {t.photoUrl && <a href={t.photoUrl} target="_blank" rel="noreferrer" className="doc-badge">Photo</a>}
                              {t.agreementUrl && <a href={t.agreementUrl} target="_blank" rel="noreferrer" className="doc-badge">Agreement</a>}
                              {!t.aadharUrl && !t.passportUrl && !t.photoUrl && !t.agreementUrl && <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>None</span>}
                            </div>
                          </td>
                          <td>₹{t.deposit.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'deposits' && (
        <div className="glass-panel animate-fade-in" style={{marginBottom: '2rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h2 style={{margin: 0}}>Deposits Breakdown</h2>
            <button className="btn btn-success hide-on-desktop" style={{padding: '0.4rem 0.8rem', fontSize: '0.85rem'}} onClick={() => setShowCashModal(true)}>💰 Cash Entry</button>
          </div>
          <div style={{overflowX: 'auto', overflowY: 'auto', maxHeight: '50vh'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Unit/House</th>
                  <th>Date of Deposit</th>
                  <th>Deposit Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeTenants.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span 
                        className="client-name-link"
                        onClick={() => setSelectedClient(t)}
                      >
                        {t.name}
                      </span>
                    </td>
                    <td>
                      <div style={{fontWeight: '600', color: '#ef4444'}}>Unit : {t.unitNo || '-'}</div>
                      <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>House : {t.houseNo || '-'}</div>
                    </td>
                    <td>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                    <td style={{fontWeight: '600'}}>₹{t.deposit.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}
                {activeTenants.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center'}}>No active deposits found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'pending' && (
        <div className="glass-panel animate-fade-in" style={{marginBottom: '2rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h2 style={{margin: 0}}>Pending Rent Invoices</h2>
            <button className="btn btn-success hide-on-desktop" style={{padding: '0.4rem 0.8rem', fontSize: '0.85rem'}} onClick={() => setShowCashModal(true)}>💰 Cash Entry</button>
          </div>
          <div style={{overflowX: 'auto', overflowY: 'auto', maxHeight: '40vh'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tenant Name</th>
                  <th>Due Date</th>
                  <th>Amount Owed</th>
                  <th style={{textAlign: 'right'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoices.map(inv => {
                  const overdueCount = pendingInvoices.filter(i => i.tenantId === inv.tenantId && new Date(i.dueDate) < new Date()).length;
                  return (
                  <tr key={inv.id}>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                        {inv.tenant.name}
                        {overdueCount > 0 && (
                          <svg 
                            className={overdueCount >= 3 ? 'bulb-red' : overdueCount === 2 ? 'bulb-orange' : 'bulb-yellow'} 
                            width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                            style={{flexShrink: 0}}
                          >
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 17.5c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2z"/>
                          </svg>
                        )}
                      </div>
                    </td>
                    <td>{new Date(inv.dueDate).toLocaleDateString('en-IN')}</td>
                    <td style={{color: inv.status === 'VERIFYING' ? '#fbbf24' : 'var(--warning-color)', fontWeight: '600', whiteSpace: 'nowrap'}}>
                      ₹{inv.amountDue.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      {inv.type === 'EB' && <span className="eb-badge">⚡ EB</span>}
                      {inv.status === 'VERIFYING' && <span style={{fontSize: '0.75rem', marginLeft: '0.4rem', color: '#fbbf24', fontWeight: 'normal'}}>(⏳ Tenant claims paid)</span>}
                    </td>
                    <td style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'nowrap'}}>
                      {inv.status === 'VERIFYING' ? (
                        <>
                          <button 
                            className="btn btn-success" 
                            style={{padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold'}}
                            onClick={() => handleMarkPaid(inv.id, true)}
                            title="Confirm payment received"
                          >
                            Confirm
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold'}}
                            onClick={() => handleRejectPayment(inv)}
                            title="Reject payment claim"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="btn btn-outline" 
                            style={{padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold', borderColor: 'var(--text-success)', color: 'var(--text-success)'}}
                            onClick={() => handleMarkPaid(inv.id)}
                          >
                            Cash Received
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold'}}
                            onClick={() => handleSendStrictReminder(inv)}
                          >
                            Strict Reminder
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )})}
                {pendingInvoices.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center'}}>No pending invoices right now!</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={`quick-actions-section ${activeView ? 'hide-on-mobile' : ''}`}>
        <h2 style={{margin: '0 0 1.5rem 0'}}>Quick Actions</h2>
        <div className="quick-actions-grid">
          
          <Link href="/tenants" className="quick-action-card">
            <div className="qa-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <div className="qa-title">Manage Tenants</div>
              <div className="qa-subtext">Add tenants & view KYC.</div>
            </div>
          </Link>
          
          <Link href="/invoices" className="quick-action-card">
            <div className="qa-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div>
              <div className="qa-title">Send Invoices</div>
              <div className="qa-subtext">Manual WhatsApp links.</div>
            </div>
          </Link>
          
        </div>
      </div>
      
      {/* Floating Cash Entry Button */}
      <div 
        onClick={() => setShowCashModal(true)}
        style={{
          position: 'fixed',
          bottom: '90px', // Above bottom nav
          right: '20px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
          cursor: 'pointer',
          zIndex: 900
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <ClientInfoModal tenant={selectedClient} onClose={() => setSelectedClient(null)} />
    </>
  )
}
