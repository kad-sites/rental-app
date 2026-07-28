"use client"
import { useState, useEffect, Fragment } from 'react'
import ClientInfoModal from '../components/ClientInfoModal'

export default function TenantsPage() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showActive, setShowActive] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // Edit State
  const [editingId, setEditingId] = useState(null)
  const [currentDocs, setCurrentDocs] = useState({ aadharUrl: null, passportUrl: null, photoUrl: null, agreementUrl: null })
  const [removedDocs, setRemovedDocs] = useState({ aadhar: false, passport: false, photo: false, agreement: false, roommate1Aadhar: false, roommate1Passport: false, roommate1Photo: false, roommate2Aadhar: false, roommate2Passport: false, roommate2Photo: false })
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [files, setFiles] = useState({ aadhar: null, passport: null, photo: null, agreement: null, roommate1Aadhar: null, roommate1Passport: null, roommate1Photo: null, roommate2Aadhar: null, roommate2Passport: null, roommate2Photo: null })
  const [formData, setFormData] = useState({ name: '', phone: '91', houseNo: '', unitNo: '', deposit: '', rentAmount: '', initialMeterReading: '0', ebRate: '10', roommate1Name: '', roommate1Phone: '91', roommate2Name: '', roommate2Phone: '91' })
  const [ebModalOpen, setEbModalOpen] = useState(false)
  const [selectedEbTenant, setSelectedEbTenant] = useState(null)
  const [ebCurrentReading, setEbCurrentReading] = useState('')
  const [ebGenerating, setEbGenerating] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [roommateCount, setRoommateCount] = useState(0)

  useEffect(() => {
    fetchTenants()
  }, [showActive])

  const fetchTenants = async () => {
    setLoading(true)
    const res = await fetch(`/api/tenants?isActive=${showActive}`)
    const data = await res.json()
    setTenants(data)
    setLoading(false)
  }

  const handleFileChange = (type, e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 4.5 * 1024 * 1024) {
        alert(`The file for ${type} is too large (max 4.5MB allowed). Please select a smaller file.`);
        e.target.value = '';
        return;
      }
      setFiles({ ...files, [type]: file })
      // If they upload a new one, we no longer consider the old one "removed" explicitly (it will just be overwritten)
      setRemovedDocs({ ...removedDocs, [type]: false })
    }
  }

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // keep only digits
    if (val.length > 0 && !val.startsWith('91') && !val.startsWith('9') && !val.startsWith('1')) {
       val = '91' + val;
    }
    if (val === '9' || val === '') val = '91';
    setFormData({...formData, phone: val});
  }

  const handleEditClick = (tenant) => {
    setEditingId(tenant.id)
    setIsFormOpen(true)
    setFormData({
      name: tenant.name,
      phone: tenant.phone,
      houseNo: tenant.houseNo || '',
      unitNo: tenant.unitNo || '',
      deposit: tenant.deposit.toString(),
      rentAmount: tenant.rentAmount.toString(),
      initialMeterReading: (tenant.initialMeterReading || 0).toString(),
      ebRate: (tenant.ebRate || 0).toString(),
      roommate1Name: tenant.roommate1Name || '',
      roommate1Phone: tenant.roommate1Phone || '91',
      roommate2Name: tenant.roommate2Name || '',
      roommate2Phone: tenant.roommate2Phone || '91'
    })
    
    // Set roommate count based on existing data
    if (tenant.roommate2Name || (tenant.roommate2Phone && tenant.roommate2Phone !== '91')) {
      setRoommateCount(2)
    } else if (tenant.roommate1Name || (tenant.roommate1Phone && tenant.roommate1Phone !== '91')) {
      setRoommateCount(1)
    } else {
      setRoommateCount(0)
    }

    setCurrentDocs({
      aadharUrl: tenant.aadharUrl,
      passportUrl: tenant.passportUrl,
      photoUrl: tenant.photoUrl,
      agreementUrl: tenant.agreementUrl,
      roommate1AadharUrl: tenant.roommate1AadharUrl,
      roommate1PassportUrl: tenant.roommate1PassportUrl,
      roommate1PhotoUrl: tenant.roommate1PhotoUrl,
      roommate2AadharUrl: tenant.roommate2AadharUrl,
      roommate2PassportUrl: tenant.roommate2PassportUrl,
      roommate2PhotoUrl: tenant.roommate2PhotoUrl
    })
    setRemovedDocs({ aadhar: false, passport: false, photo: false, agreement: false, roommate1Aadhar: false, roommate1Passport: false, roommate1Photo: false, roommate2Aadhar: false, roommate2Passport: false, roommate2Photo: false })
    setFiles({ aadhar: null, passport: null, photo: null, agreement: null, roommate1Aadhar: null, roommate1Passport: null, roommate1Photo: null, roommate2Aadhar: null, roommate2Passport: null, roommate2Photo: null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsFormOpen(false)
    setFormData({ name: '', phone: '91', houseNo: '', unitNo: '', deposit: '', rentAmount: '', initialMeterReading: '0', ebRate: '10', roommate1Name: '', roommate1Phone: '91', roommate2Name: '', roommate2Phone: '91' })
    setRoommateCount(0)
    setFiles({ aadhar: null, passport: null, photo: null, agreement: null, roommate1Aadhar: null, roommate1Passport: null, roommate1Photo: null, roommate2Aadhar: null, roommate2Passport: null, roommate2Photo: null })
    setCurrentDocs({ aadharUrl: null, passportUrl: null, photoUrl: null, agreementUrl: null, roommate1AadharUrl: null, roommate1PassportUrl: null, roommate1PhotoUrl: null, roommate2AadharUrl: null, roommate2PassportUrl: null, roommate2PhotoUrl: null })
    setRemovedDocs({ aadhar: false, passport: false, photo: false, agreement: false, roommate1Aadhar: false, roommate1Passport: false, roommate1Photo: false, roommate2Aadhar: false, roommate2Passport: false, roommate2Photo: false })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    
    let uploadedUrls = {};
    if (!editingId) {
      uploadedUrls = { 
        aadharUrl: null, passportUrl: null, photoUrl: null, agreementUrl: null,
        roommate1AadharUrl: null, roommate1PassportUrl: null, roommate1PhotoUrl: null,
        roommate2AadharUrl: null, roommate2PassportUrl: null, roommate2PhotoUrl: null
      };
    } else {
      // In Edit Mode, set any explicitly removed docs to null so the backend clears them
      ['aadhar', 'passport', 'photo', 'agreement', 'roommate1Aadhar', 'roommate1Passport', 'roommate1Photo', 'roommate2Aadhar', 'roommate2Passport', 'roommate2Photo'].forEach(type => {
        if (removedDocs[type]) {
          uploadedUrls[`${type}Url`] = null;
        }
      });
    }
    
    // Upload files sequentially
    for (const [key, file] of Object.entries(files)) {
      if (file) {
        const form = new FormData();
        form.append('file', file);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: form
        });
        
        if (uploadRes.ok) {
          const blob = await uploadRes.json();
          uploadedUrls[`${key}Url`] = blob.url;
        } else {
          let errMsg = uploadRes.statusText;
          try {
            const errData = await uploadRes.json();
            if (errData.error) errMsg = errData.error;
          } catch (e) {}
          
          alert(`Failed to upload ${key}. Error: ${errMsg}. Please ensure Vercel Blob is configured and you are not exceeding free tier limits.`);
          setUploading(false);
          return;
        }
      }
    }

    const endpoint = '/api/tenants';
    const method = editingId ? 'PATCH' : 'POST';
    const bodyPayload = editingId 
      ? { id: editingId, ...formData, ...uploadedUrls } 
      : { ...formData, ...uploadedUrls };

    const res = await fetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    })
    
    if (res.ok) {
      cancelEdit(); 
      document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
      fetchTenants();
    }
    setUploading(false)
  }

  const handleToggleActive = async (tenantId, currentStatus) => {
    if (!confirm(`Are you sure you want to mark this tenant as ${currentStatus ? 'Vacated' : 'Active'}?`)) return;
    
    const res = await fetch('/api/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tenantId, isActive: !currentStatus })
    })
    if (res.ok) {
      fetchTenants()
    }
  }

  const handleDeleteTenant = async (tenantId) => {
    if (!confirm('Are you sure you want to delete this tenant? Their past invoices and collections will be preserved under their name.')) return;
    
    const res = await fetch('/api/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tenantId, isDeleted: true })
    })
    if (res.ok) {
      fetchTenants()
    }
  }

  const handleGenerateSingle = async (tenantId) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId })
    })
    if (res.ok) {
      alert('Invoice generated successfully! Go to the Invoices tab to send it via WhatsApp.')
    } else {
      alert('Failed to generate invoice.')
    }
  }

  const handleGenerateEbBill = async (e) => {
    e.preventDefault();
    if(!selectedEbTenant) return;
    setEbGenerating(true);
    
    const res = await fetch('/api/invoices/eb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: selectedEbTenant.id, currentReading: ebCurrentReading })
    })
    
    setEbGenerating(false);
    if (res.ok) {
      alert('EB Bill generated successfully! Go to Invoices tab.');
      setEbModalOpen(false);
      fetchTenants();
    } else {
      const data = await res.json();
      alert(`Error: ${data.error || 'Failed to generate EB bill'}`);
    }
  }

  // Group and sort tenants for rendering
  const groupedTenants = {};
  const houseNumbers = [];
  
  tenants.forEach(t => {
    const house = t.houseNo || 'Unassigned';
    if (!groupedTenants[house]) {
      groupedTenants[house] = [];
      houseNumbers.push(house);
    }
    groupedTenants[house].push(t);
  });

  houseNumbers.sort((a, b) => {
    if (a === 'Unassigned') return 1;
    if (b === 'Unassigned') return -1;
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  // Sort by unit number ascending within each house
  Object.keys(groupedTenants).forEach(house => {
    groupedTenants[house].sort((a, b) => {
      const unitA = parseInt(a.unitNo) || 0;
      const unitB = parseInt(b.unitNo) || 0;
      return unitA - unitB;
    });
  });

  return (
    <main className="container animate-fade-in">
      <div className="flex-between">
        <h1>Tenants Management</h1>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
        {/* Add/Edit Tenant Form */}
        <div className="glass-panel" style={{paddingTop: '0'}}>
          <div 
            className="collapsible-header-btn"
            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: !editingId ? 'pointer' : 'default', marginTop: '1rem'}}
            onClick={() => !editingId && setIsFormOpen(!isFormOpen)}
          >
            <h2 style={{margin: 0, color: editingId ? 'var(--warning-color)' : 'var(--text-primary)', fontSize: '1rem', fontWeight: '600'}}>
              {editingId ? 'Edit Tenant Details' : (
                <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span style={{fontSize: '1.2rem'}}>✨</span> Add New Tenant
                </span>
              )}
            </h2>
            {!editingId && (
              <div style={{
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '50%', 
                width: '32px', height: '32px', 
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                transform: isFormOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            )}
          </div>
          
          {(isFormOpen || editingId) && (
            <div style={{marginTop: '1.5rem'}} className="animate-fade-in">
              <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name <span style={{color: '#ef4444'}}>*</span></label>
              <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label>WhatsApp Phone <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '400'}}>(Digits Only, Prefix 91)</span> <span style={{color: '#ef4444'}}>*</span></label>
              <input type="tel" className="form-control" required value={formData.phone} onChange={handlePhoneChange} />
            </div>

            {roommateCount >= 1 && (
              <div className="animate-fade-in" style={{position: 'relative', marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                <button type="button" style={{position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px'}} onClick={() => {
                  if (roommateCount === 2) {
                    setFormData({...formData, roommate1Name: formData.roommate2Name, roommate1Phone: formData.roommate2Phone, roommate2Name: '', roommate2Phone: '91'});
                    setRoommateCount(1);
                  } else {
                    setFormData({...formData, roommate1Name: '', roommate1Phone: '91'});
                    setRoommateCount(0);
                  }
                }}>×</button>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Roommate Name</label>
                    <input type="text" className="form-control" value={formData.roommate1Name} onChange={e => setFormData({...formData, roommate1Name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Roommate Phone</label>
                    <input type="tel" className="form-control" value={formData.roommate1Phone} onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val === '' || val.startsWith('91')) setFormData({...formData, roommate1Phone: val});
                    }} />
                  </div>
                </div>
                <div style={{marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)'}}>
                  <h3 style={{fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary-color)'}}>Roommate Documents</h3>
                  
                  {/* Show existing roommate 1 documents in edit mode */}
                  {editingId && (
                    <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem'}}>
                      {['roommate1Aadhar', 'roommate1Passport', 'roommate1Photo'].map(type => {
                        const hasDoc = currentDocs[`${type}Url`];
                        const isRemoved = removedDocs[type];
                        const displayType = type.replace('roommate1', '');
                        if (hasDoc && !isRemoved) {
                          return (
                            <span key={type} className="badge" style={{background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', display: 'flex', gap: '6px', alignItems: 'center'}}>
                              {displayType}
                              <button type="button" onClick={() => setRemovedDocs({...removedDocs, [type]: true})} style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px'}}>🗑️</button>
                            </span>
                          )
                        } else if (hasDoc && isRemoved) {
                          return <span key={type} className="badge" style={{background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', textDecoration: 'line-through'}}>{displayType} (Will be deleted)</span>
                        }
                        return null;
                      })}
                    </div>
                  )}
                  
                  <div className="form-group" style={{marginBottom: '0.5rem'}}>
                    <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'nowrap'}}>
                      <select 
                        id="r1-doc-select"
                        className="form-control" 
                        style={{flex: '2', minWidth: '0'}}
                        onChange={(e) => {
                          const input = document.getElementById('r1-unified-file-upload');
                          input.setAttribute('data-doctype', e.target.value);
                          input.value = '';
                          document.getElementById('r1-unified-camera-upload').value = '';
                        }}
                      >
                        <option value="roommate1Aadhar">Aadhar</option>
                        <option value="roommate1Passport">Passport</option>
                        <option value="roommate1Photo">Photo</option>
                      </select>
                      <div style={{flex: '1', display: 'flex', gap: '0.3rem', minWidth: '0'}}>
                        <input 
                          type="file" 
                          id="r1-unified-file-upload"
                          data-doctype="roommate1Aadhar"
                          className="form-control" 
                          accept="image/*,application/pdf" 
                          onChange={(e) => {
                            const type = e.target.getAttribute('data-doctype');
                            handleFileChange(type, e);
                          }} 
                          style={{display: 'none'}} 
                        />
                        <button type="button" className="btn btn-outline" style={{padding: '0.5rem 0.8rem', flex: '1', borderColor: 'var(--border-color)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'center'}} onClick={() => document.getElementById('r1-unified-file-upload').click()} title="Choose File">📂</button>
                        <button type="button" className="btn btn-outline" style={{padding: '0.5rem 0.8rem', flex: '1', borderColor: 'var(--border-color)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'center'}} onClick={() => {
                          const select = document.getElementById('r1-doc-select');
                          if (select) select.value = 'roommate1Photo';
                          document.getElementById('r1-unified-file-upload').setAttribute('data-doctype', 'roommate1Photo');
                          document.getElementById('r1-unified-camera-upload').click();
                        }} title="Open Camera">📷</button>
                        <input 
                          type="file" 
                          id="r1-unified-camera-upload"
                          accept="image/*" 
                          capture="environment" 
                          style={{display: 'none'}} 
                          onChange={(e) => {
                            const mainInput = document.getElementById('r1-unified-file-upload');
                            const type = mainInput.getAttribute('data-doctype');
                            handleFileChange(type, e);
                            // Transfer file object to main input isn't directly possible due to security, but state handles it. 
                            // We just clear main input so it doesn't show a stale name.
                            mainInput.value = '';
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Show attached roommate 1 files */}
                  <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                    {['roommate1Aadhar', 'roommate1Passport', 'roommate1Photo'].map(type => {
                      if (!files[type]) return null;
                      const displayType = type.replace('roommate1', '');
                      return (
                        <span key={type} className="badge badge-paid" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                          {displayType} Attached
                          <button type="button" onClick={() => {
                            setFiles({...files, [type]: null});
                            const input = document.getElementById('r1-unified-file-upload');
                            if (input && input.getAttribute('data-doctype') === type) input.value = '';
                          }} style={{background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0 2px'}}>✖</button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {roommateCount >= 2 && (
              <div className="animate-fade-in" style={{position: 'relative', marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                <button type="button" style={{position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px'}} onClick={() => {
                  setFormData({...formData, roommate2Name: '', roommate2Phone: '91'});
                  setRoommateCount(1);
                }}>×</button>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Roommate Name</label>
                    <input type="text" className="form-control" value={formData.roommate2Name} onChange={e => setFormData({...formData, roommate2Name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Roommate Phone</label>
                    <input type="tel" className="form-control" value={formData.roommate2Phone} onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val === '' || val.startsWith('91')) setFormData({...formData, roommate2Phone: val});
                    }} />
                  </div>
                </div>
                <div style={{marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)'}}>
                  <h3 style={{fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary-color)'}}>Roommate Documents</h3>
                  
                  {/* Show existing roommate 2 documents in edit mode */}
                  {editingId && (
                    <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem'}}>
                      {['roommate2Aadhar', 'roommate2Passport', 'roommate2Photo'].map(type => {
                        const hasDoc = currentDocs[`${type}Url`];
                        const isRemoved = removedDocs[type];
                        const displayType = type.replace('roommate2', '');
                        if (hasDoc && !isRemoved) {
                          return (
                            <span key={type} className="badge" style={{background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', display: 'flex', gap: '6px', alignItems: 'center'}}>
                              {displayType}
                              <button type="button" onClick={() => setRemovedDocs({...removedDocs, [type]: true})} style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px'}}>🗑️</button>
                            </span>
                          )
                        } else if (hasDoc && isRemoved) {
                          return <span key={type} className="badge" style={{background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', textDecoration: 'line-through'}}>{displayType} (Will be deleted)</span>
                        }
                        return null;
                      })}
                    </div>
                  )}
                  
                  <div className="form-group" style={{marginBottom: '0.5rem'}}>
                    <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'nowrap'}}>
                      <select 
                        id="r2-doc-select"
                        className="form-control" 
                        style={{flex: '2', minWidth: '0'}}
                        onChange={(e) => {
                          const input = document.getElementById('r2-unified-file-upload');
                          input.setAttribute('data-doctype', e.target.value);
                          input.value = '';
                          document.getElementById('r2-unified-camera-upload').value = '';
                        }}
                      >
                        <option value="roommate2Aadhar">Aadhar</option>
                        <option value="roommate2Passport">Passport</option>
                        <option value="roommate2Photo">Photo</option>
                      </select>
                      <div style={{flex: '1', display: 'flex', gap: '0.3rem', minWidth: '0'}}>
                        <input 
                          type="file" 
                          id="r2-unified-file-upload"
                          data-doctype="roommate2Aadhar"
                          className="form-control" 
                          accept="image/*,application/pdf" 
                          onChange={(e) => {
                            const type = e.target.getAttribute('data-doctype');
                            handleFileChange(type, e);
                          }} 
                          style={{display: 'none'}} 
                        />
                        <button type="button" className="btn btn-outline" style={{padding: '0.5rem 0.8rem', flex: '1', borderColor: 'var(--border-color)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'center'}} onClick={() => document.getElementById('r2-unified-file-upload').click()} title="Choose File">📂</button>
                        <button type="button" className="btn btn-outline" style={{padding: '0.5rem 0.8rem', flex: '1', borderColor: 'var(--border-color)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'center'}} onClick={() => {
                          const select = document.getElementById('r2-doc-select');
                          if (select) select.value = 'roommate2Photo';
                          document.getElementById('r2-unified-file-upload').setAttribute('data-doctype', 'roommate2Photo');
                          document.getElementById('r2-unified-camera-upload').click();
                        }} title="Open Camera">📷</button>
                        <input 
                          type="file" 
                          id="r2-unified-camera-upload"
                          accept="image/*" 
                          capture="environment" 
                          style={{display: 'none'}} 
                          onChange={(e) => {
                            const mainInput = document.getElementById('r2-unified-file-upload');
                            const type = mainInput.getAttribute('data-doctype');
                            handleFileChange(type, e);
                            mainInput.value = '';
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Show attached roommate 2 files */}
                  <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                    {['roommate2Aadhar', 'roommate2Passport', 'roommate2Photo'].map(type => {
                      if (!files[type]) return null;
                      const displayType = type.replace('roommate2', '');
                      return (
                        <span key={type} className="badge badge-paid" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                          {displayType} Attached
                          <button type="button" onClick={() => {
                            setFiles({...files, [type]: null});
                            const input = document.getElementById('r2-unified-file-upload');
                            if (input && input.getAttribute('data-doctype') === type) input.value = '';
                          }} style={{background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0 2px'}}>✖</button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {roommateCount < 2 && (
              <div style={{marginTop: '1rem', textAlign: 'center'}}>
                <button type="button" className="btn btn-outline" style={{padding: '0.4rem 0.8rem', fontSize: '0.9rem', width: 'fit-content', color: 'var(--text-success)', borderColor: 'var(--text-success)'}} onClick={() => setRoommateCount(prev => prev + 1)}>
                  + {roommateCount === 0 ? 'Add Roommate' : 'Add Another Roommate'}
                </button>
              </div>
            )}
            
            <div className="form-grid" style={{marginTop: '1.5rem'}}>
              <div className="form-group">
                <label>House No.</label>
                <input type="text" className="form-control" value={formData.houseNo} onChange={e => setFormData({...formData, houseNo: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Unit No.</label>
                <input type="text" className="form-control" value={formData.unitNo} onChange={e => setFormData({...formData, unitNo: e.target.value})} />
              </div>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Deposit (₹)</label>
                <input type="number" className="form-control" required value={formData.deposit} onChange={e => setFormData({...formData, deposit: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Rent Amount (₹)</label>
                <input type="number" className="form-control" required value={formData.rentAmount} onChange={e => setFormData({...formData, rentAmount: e.target.value})} />
              </div>
            </div>
            
            <div className="form-grid" style={{marginTop: '1.5rem'}}>
              <div className="form-group">
                <label>Initial Meter Reading <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>(defaults to 0)</span></label>
                <input type="number" className="form-control" required value={formData.initialMeterReading} onChange={e => setFormData({...formData, initialMeterReading: e.target.value})} />
              </div>
              <div className="form-group">
                <label>EB Rate (Per Unit) (₹)</label>
                <input type="number" className="form-control" required value={formData.ebRate} onChange={e => setFormData({...formData, ebRate: e.target.value})} />
              </div>
            </div>

            <h3 style={{fontSize: '0.9rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--text-success)'}}>
              {editingId ? 'Update Documents (Optional)' : 'Upload Documents'}
            </h3>

            {/* Display existing documents in Edit Mode with option to remove */}
            {editingId && (
              <div style={{marginBottom: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'}}>
                <label style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block'}}>Current Saved Documents:</label>
                <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                  {['aadhar', 'passport', 'photo', 'agreement'].map(type => {
                    const hasDoc = currentDocs[`${type}Url`];
                    const isRemoved = removedDocs[type];
                    
                    const formatLabel = (t) => t.charAt(0).toUpperCase() + t.slice(1);

                    if (hasDoc && !isRemoved) {
                      return (
                        <span key={type} className="badge" style={{background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', display: 'flex', gap: '6px', alignItems: 'center'}}>
                          {formatLabel(type)}
                          <button 
                            type="button" 
                            onClick={() => setRemovedDocs({...removedDocs, [type]: true})} 
                            style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px'}}
                            title="Delete this document"
                          >
                            🗑️
                          </button>
                        </span>
                      )
                    } else if (hasDoc && isRemoved) {
                      return (
                        <span key={type} className="badge" style={{background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', textDecoration: 'line-through'}}>
                          {formatLabel(type)} (Will be deleted)
                        </span>
                      )
                    }
                    return null;
                  })}
                  {!['aadhar', 'passport', 'photo', 'agreement'].some(type => currentDocs[`${type}Url`]) && (
                    <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>No documents saved currently.</span>
                  )}
                </div>
              </div>
            )}
            <div className="form-group" style={{marginBottom: '0.5rem'}}>
              <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'nowrap'}}>
                <select 
                  id="primary-doc-select"
                  className="form-control" 
                  style={{flex: '2', minWidth: '0'}}
                  onChange={(e) => {
                    const input = document.getElementById('unified-file-upload');
                    input.setAttribute('data-doctype', e.target.value);
                    input.value = '';
                    document.getElementById('unified-camera-upload').value = '';
                  }}
                >
                  <option value="aadhar">Aadhar</option>
                  <option value="passport">Passport</option>
                  <option value="photo">Photo</option>
                  <option value="agreement">Agreement</option>
                </select>
                <div style={{flex: '1', display: 'flex', gap: '0.3rem', minWidth: '0'}}>
                  <input 
                    type="file" 
                    id="unified-file-upload"
                    data-doctype="aadhar"
                    className="form-control" 
                    accept="image/*,application/pdf" 
                    onChange={(e) => {
                      const type = e.target.getAttribute('data-doctype');
                      handleFileChange(type, e);
                    }} 
                    style={{display: 'none'}} 
                  />
                  <button type="button" className="btn btn-outline" style={{padding: '0.5rem 0.8rem', flex: '1', borderColor: 'var(--border-color)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'center'}} onClick={() => document.getElementById('unified-file-upload').click()} title="Choose File">📂</button>
                  <button type="button" className="btn btn-outline" style={{padding: '0.5rem 0.8rem', flex: '1', borderColor: 'var(--border-color)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'center'}} onClick={() => {
                    const select = document.getElementById('primary-doc-select');
                    if (select) select.value = 'photo';
                    document.getElementById('unified-file-upload').setAttribute('data-doctype', 'photo');
                    document.getElementById('unified-camera-upload').click();
                  }} title="Open Camera">📷</button>
                  <input 
                    type="file" 
                    id="unified-camera-upload"
                    accept="image/*" 
                    capture="environment" 
                    style={{display: 'none'}} 
                    onChange={(e) => {
                      const mainInput = document.getElementById('unified-file-upload');
                      const type = mainInput.getAttribute('data-doctype');
                      handleFileChange(type, e);
                      mainInput.value = '';
                    }} 
                  />
                </div>
              </div>
            </div>
            
            {/* Show attached files */}
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem'}}>
              {['aadhar', 'passport', 'photo', 'agreement'].map(type => {
                const file = files[type];
                if (!file) return null;
                const formatLabel = (t) => t.charAt(0).toUpperCase() + t.slice(1);
                return (
                  <span key={type} className="badge badge-paid" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                    {formatLabel(type)} Attached
                    <button type="button" onClick={() => {
                      setFiles({...files, [type]: null});
                      const input = document.getElementById('unified-file-upload');
                      if (input && input.getAttribute('data-doctype') === type) input.value = '';
                    }} style={{background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0 2px'}}>✖</button>
                  </span>
                )
              })}
            </div>

            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button type="submit" className={`btn ${editingId ? 'btn-success' : 'btn-success'}`} style={{flex: '1', backgroundColor: editingId ? 'var(--warning-color)' : ''}} disabled={uploading}>
                {uploading ? 'Processing...' : (editingId ? 'Update Tenant' : 'Add Tenant')}
              </button>
              {editingId && (
                <button type="button" className="btn" style={{backgroundColor: 'rgba(255,255,255,0.1)'}} onClick={cancelEdit} disabled={uploading}>
                  Cancel
                </button>
              )}
            </div>
          </form>
          </div>
          )}
        </div>

        {/* Tenants List */}
        <div className="glass-panel">
          <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem'}}>
            <button 
              className={`btn ${showActive ? 'btn-success' : 'btn-outline'}`} 
              onClick={() => setShowActive(true)}
            >
              Active Tenants
            </button>
            <button 
              className={`btn ${!showActive ? 'btn-success' : 'btn-outline'}`} 
              onClick={() => setShowActive(false)}
            >
              Vacated (Past Tenants)
            </button>
          </div>

          {loading ? <p>Loading...</p> : (
            <div style={{overflowX: 'auto'}}>
              <table className="data-table tenants-table">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Name & Info</th>
                    <th>Documents</th>
                    <th>Deposit</th>
                    <th>Rent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.length === 0 ? (
                    <tr><td colSpan="6" style={{textAlign: 'center', color: 'var(--text-secondary)'}}>No {showActive ? 'active' : 'vacated'} tenants found.</td></tr>
                  ) : (
                    houseNumbers.map(house => (
                      <Fragment key={house}>
                        <tr>
                          <td colSpan="6" style={{backgroundColor: 'transparent', border: 'none', padding: '1rem 0.5rem 0.25rem 0.5rem'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                              <div style={{color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap'}}>
                                🏡 HOUSE {house === 'Unassigned' ? 'UNASSIGNED' : house}
                              </div>
                              <div style={{flex: 1, height: '1px', borderBottom: '1px dashed rgba(255,255,255,0.15)'}}></div>
                            </div>
                          </td>
                        </tr>
                        {groupedTenants[house].map(t => (
                          <tr key={t.id} style={{backgroundColor: t.invoices?.length >= 3 ? 'rgba(239, 68, 68, 0.2)' : t.invoices?.length === 2 ? 'rgba(249, 115, 22, 0.2)' : t.invoices?.length === 1 ? 'rgba(234, 179, 8, 0.2)' : 'transparent'}}>
                            <td data-label="Unit" style={{whiteSpace: 'nowrap'}}>
                              <div style={{fontWeight: '450', color: 'var(--text-primary)'}}>Unit {t.unitNo || '-'}</div>
                            </td>
                            <td data-label="Name & Info">
                              <span 
                                className="client-name-link"
                                onClick={() => setSelectedClient(t)}
                              >
                                {t.name}
                              </span>
                              <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>+{t.phone}</div>
                            </td>
                            <td data-label="Documents">
                              <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '6px', alignItems: 'center'}}>
                                {t.aadharUrl && <a href={t.aadharUrl} target="_blank" rel="noreferrer" className="doc-badge">Aadhar</a>}
                                {t.passportUrl && <a href={t.passportUrl} target="_blank" rel="noreferrer" className="doc-badge">Passport</a>}
                                {t.photoUrl && <a href={t.photoUrl} target="_blank" rel="noreferrer" className="doc-badge">Photo</a>}
                                {t.agreementUrl && <a href={t.agreementUrl} target="_blank" rel="noreferrer" className="doc-badge">Agreement</a>}
                                {!t.aadharUrl && !t.passportUrl && !t.photoUrl && !t.agreementUrl && <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>None</span>}
                              </div>
                            </td>
                            <td data-label="Deposit">₹{t.deposit.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            <td data-label="Rent">₹{t.rentAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            <td data-label="Actions">
                              <div style={{display: 'flex', gap: '0.3rem', flexWrap: 'nowrap'}}>
                                {t.isActive && (
                                  <>
                                    <button 
                                      className="btn btn-success" 
                                      style={{padding: '0.3rem 0.5rem', fontSize: '0.75rem', minWidth: '55px', textAlign: 'center'}}
                                      onClick={() => handleGenerateSingle(t.id)}
                                    >
                                      Rent Bill
                                    </button>
                                    <button 
                                      className="btn btn-outline" 
                                      style={{padding: '0.3rem 0.5rem', fontSize: '0.75rem', minWidth: '55px', textAlign: 'center', borderColor: 'var(--primary-color)', color: 'var(--primary-color)'}}
                                      onClick={() => { setSelectedEbTenant(t); setEbCurrentReading(''); setEbModalOpen(true); }}
                                    >
                                      EB Bill
                                    </button>
                                  </>
                                )}
                                <button 
                                  className="btn" 
                                  style={{padding: '0.3rem 0.5rem', fontSize: '0.75rem', minWidth: '55px', textAlign: 'center', backgroundColor: '#ef4444', color: '#ffffff'}}
                                  onClick={() => handleEditClick(t)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-success" 
                                  style={{padding: '0.3rem 0.5rem', fontSize: '0.75rem', minWidth: '55px', textAlign: 'center'}}
                                  onClick={() => handleToggleActive(t.id, t.isActive)}
                                >
                                  {t.isActive ? 'Vacate' : 'Restore'}
                                </button>
                                {!t.isActive && (
                                  <button 
                                    className="btn" 
                                    style={{padding: '0.3rem 0.5rem', fontSize: '0.75rem', minWidth: '55px', textAlign: 'center', backgroundColor: '#333333', color: '#ffffff', border: '1px solid #444444'}}
                                    onClick={() => handleDeleteTenant(t.id)}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ClientInfoModal tenant={selectedClient} onClose={() => setSelectedClient(null)} />

      {ebModalOpen && selectedEbTenant && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
        }}>
          <div className="glass-panel" style={{width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-color)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h2 style={{margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)'}}>Generate EB Bill</h2>
              <button onClick={() => setEbModalOpen(false)} style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem'}}>&times;</button>
            </div>
            
            <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem'}}>
              Tenant: <strong style={{color: 'var(--text-primary)'}}>{selectedEbTenant.name}</strong><br />
              Last Reading: <strong style={{color: 'var(--text-primary)'}}>{selectedEbTenant.lastMeterReading || 0}</strong><br />
              Rate: <strong style={{color: 'var(--text-primary)'}}>₹{selectedEbTenant.ebRate || 0} / unit</strong>
            </p>

            <form onSubmit={handleGenerateEbBill}>
              <div className="form-group" style={{marginBottom: '1.5rem'}}>
                <label>Current Meter Reading</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required 
                  value={ebCurrentReading} 
                  onChange={e => setEbCurrentReading(e.target.value)}
                  placeholder={`Must be > ${selectedEbTenant.lastMeterReading || 0}`}
                />
              </div>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <button type="submit" className="btn btn-success" style={{flex: 1}} disabled={ebGenerating}>
                  {ebGenerating ? 'Generating...' : 'Generate Bill'}
                </button>
                <button type="button" className="btn btn-outline" style={{flex: 1}} onClick={() => setEbModalOpen(false)} disabled={ebGenerating}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
