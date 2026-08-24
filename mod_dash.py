import re

with open('app/components/DashboardClient.js', 'r', encoding='utf-8') as f:
    js = f.read()

state_vars = '''
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [cashModalMode, setCashModalMode] = useState('INVOICE');
  const [depositAmount, setDepositAmount] = useState('');
'''
js = js.replace("const [selectedInvoiceId, setSelectedInvoiceId] = useState('');\n  const [isSubmitting, setIsSubmitting] = useState(false);", state_vars.strip())

func = '''
  const handleRecordDeposit = async (e) => {
    e.preventDefault();
    if (!selectedTenantId || !depositAmount) return;
    setIsSubmitting(true);
    
    const res = await fetch('/api/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: selectedTenantId, amount: depositAmount })
    });
    setIsSubmitting(false);
    if (res.ok) {
      setShowCashModal(false);
      setSelectedTenantId('');
      setDepositAmount('');
      router.refresh();
    } else {
      alert('Failed to record deposit');
    }
  }

  const handleGlobalMarkPaid = async (e) => {
'''
js = js.replace("const handleGlobalMarkPaid = async (e) => {", func.strip())

modal_start = js.find('<h2 style={{color: \\'#fff\\', marginBottom: \\'1rem\\', paddingRight: \\'2rem\\'}}>Record Cash Payment</h2>')
modal_end = js.find('</div>\n        </div>\n      )}\n\n      {/* Welcome & Quick Stats */}')

new_modal_jsx = '''<h2 style={{color: '#fff', marginBottom: '1rem', paddingRight: '2rem'}}>Record Cash Entry</h2>

            <div style={{display: 'flex', gap: '10px', marginBottom: '1.5rem'}}>
              <button 
                type="button" 
                className={tn }
                style={{flex: 1, padding: '0.5rem', fontSize: '0.85rem'}}
                onClick={() => setCashModalMode('INVOICE')}
              >
                Pay Invoice
              </button>
              <button 
                type="button" 
                className={tn }
                style={{flex: 1, padding: '0.5rem', fontSize: '0.85rem'}}
                onClick={() => setCashModalMode('DEPOSIT')}
              >
                Advance / Deposit
              </button>
            </div>
            
            {cashModalMode === 'INVOICE' && (
              tenantsWithPending.length === 0 ? (
                <>
                  <p style={{color: 'var(--text-success)', marginBottom: '1.5rem'}}>No pending invoices exist!</p>
                  <button type="button" className="btn btn-outline" style={{width: '100%'}} onClick={() => setShowCashModal(false)}>
                    Close
                  </button>
                </>
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
                            ?{inv.amountDue.toLocaleString('en-IN')} - Due {new Date(inv.dueDate).toLocaleDateString('en-IN')}
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
              )
            )}

            {cashModalMode === 'DEPOSIT' && (
              <form onSubmit={handleRecordDeposit}>
                <div className="form-group full-width">
                  <label>Select Tenant</label>
                  <select 
                    className="form-control" 
                    value={selectedTenantId} 
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Tenant --</option>
                    {activeTenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Unit: {t.unitNo || '-'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group full-width">
                  <label>Advance Amount (?)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Enter amount received" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                  />
                  <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>
                    This will be added to the tenant's security deposit balance and tracked by date.
                  </p>
                </div>
                
                <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                  <button type="submit" className="btn btn-success" style={{flex: 1}} disabled={isSubmitting || !selectedTenantId || !depositAmount}>
                    {isSubmitting ? 'Saving...' : 'Record Deposit'}
                  </button>
                  <button type="button" className="btn btn-outline" style={{flex: 1}} onClick={() => setShowCashModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}'''

js = js[:modal_start] + new_modal_jsx + js[modal_end:]

with open('app/components/DashboardClient.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Updated DashboardClient.js')
