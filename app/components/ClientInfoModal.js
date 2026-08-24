export default function ClientInfoModal({ tenant, onClose }) {
  if (!tenant) return null;

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="glass-panel modal-content" style={{maxWidth: '400px', width: '90%'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2 style={{margin: 0, color: 'var(--text-primary)'}}>Client Information</h2>
          <button className="btn btn-outline" style={{padding: '0.2rem 0.6rem'}} onClick={onClose}>×</button>
        </div>

        <div style={{marginBottom: '1.5rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <h3 style={{margin: '0 0 0.5rem 0', color: 'var(--primary-color)', fontSize: '1.2rem'}}>{tenant.name}</h3>
              <p style={{margin: 0, color: 'var(--text-secondary)'}}>
                <span style={{fontWeight: '600', color: '#ef4444'}}>Unit : {tenant.unitNo || '-'}</span>
                <span style={{margin: '0 0.5rem'}}>|</span>
                <span>House : {tenant.houseNo || '-'}</span>
              </p>
              <p style={{margin: '0.5rem 0 0 0', fontWeight: '500'}}>+{tenant.phone}</p>
            </div>
            
            <a 
              href={tenant.photoUrl || '#'} 
              target={tenant.photoUrl ? "_blank" : "_self"}
              rel="noreferrer"
              className={tenant.photoUrl ? "profile-pic-hover" : ""}
              style={{textDecoration: 'none', width: '64px', height: '64px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', border: '2px solid var(--primary-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}}
            >
              {tenant.photoUrl ? (
                <img src={tenant.photoUrl} alt={tenant.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <span style={{fontSize: '1.5rem', color: 'var(--text-secondary)', fontWeight: 'bold'}}>{tenant.name ? tenant.name.charAt(0).toUpperCase() : '?'}</span>
              )}
            </a>
          </div>

          {(tenant.aadharUrl || tenant.passportUrl || tenant.agreementUrl) && (
            <div style={{marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px dashed rgba(0,0,0,0.1)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center'}}>
              {tenant.aadharUrl && <a href={tenant.aadharUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-primary)', borderRadius: '20px'}}><span className="bullet-3d"></span> Aadhar</a>}
              {tenant.passportUrl && <a href={tenant.passportUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-primary)', borderRadius: '20px'}}><span className="bullet-3d"></span> Passport</a>}
              {tenant.agreementUrl && <a href={tenant.agreementUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-primary)', borderRadius: '20px'}}><span className="bullet-3d"></span> Agreement</a>}
            </div>
          )}
        </div>

        {/* Roommates Section */}
        {(tenant.roommate1Name || tenant.roommate2Name) && (
          <div style={{marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
            <h4 style={{margin: '0 0 0.8rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Roommates</h4>
            
            {tenant.roommate1Name && (
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tenant.roommate2Name ? '1rem' : '0', paddingBottom: tenant.roommate2Name ? '1rem' : '0', borderBottom: tenant.roommate2Name ? '1px dashed rgba(0,0,0,0.1)' : 'none'}}>
                <div>
                  <div style={{fontWeight: '500'}}>{tenant.roommate1Name}</div>
                  <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>+{tenant.roommate1Phone}</div>
                  {(tenant.roommate1AadharUrl || tenant.roommate1PassportUrl) && (
                    <div style={{marginTop: '0.5rem', display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
                      {tenant.roommate1AadharUrl && <a href={tenant.roommate1AadharUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{padding: '0.1rem 0.5rem', fontSize: '0.7rem', borderRadius: '16px'}}><span className="bullet-3d"></span> Aadhar</a>}
                      {tenant.roommate1PassportUrl && <a href={tenant.roommate1PassportUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{padding: '0.1rem 0.5rem', fontSize: '0.7rem', borderRadius: '16px'}}><span className="bullet-3d"></span> Passport</a>}
                    </div>
                  )}
                </div>
                
                <a 
                  href={tenant.roommate1PhotoUrl || '#'}
                  target={tenant.roommate1PhotoUrl ? "_blank" : "_self"}
                  rel="noreferrer"
                  className={tenant.roommate1PhotoUrl ? "profile-pic-hover" : ""}
                  style={{textDecoration: 'none', width: '42px', height: '42px', borderRadius: '6px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}
                >
                  {tenant.roommate1PhotoUrl ? (
                    <img src={tenant.roommate1PhotoUrl} alt={tenant.roommate1Name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>{tenant.roommate1Name.charAt(0).toUpperCase()}</span>
                  )}
                </a>
              </div>
            )}

            {tenant.roommate2Name && (
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <div style={{fontWeight: '500'}}>{tenant.roommate2Name}</div>
                  <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>+{tenant.roommate2Phone}</div>
                  {(tenant.roommate2AadharUrl || tenant.roommate2PassportUrl) && (
                    <div style={{marginTop: '0.5rem', display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
                      {tenant.roommate2AadharUrl && <a href={tenant.roommate2AadharUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{padding: '0.1rem 0.5rem', fontSize: '0.7rem', borderRadius: '16px'}}><span className="bullet-3d"></span> Aadhar</a>}
                      {tenant.roommate2PassportUrl && <a href={tenant.roommate2PassportUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{padding: '0.1rem 0.5rem', fontSize: '0.7rem', borderRadius: '16px'}}><span className="bullet-3d"></span> Passport</a>}
                    </div>
                  )}
                </div>
                
                <a 
                  href={tenant.roommate2PhotoUrl || '#'}
                  target={tenant.roommate2PhotoUrl ? "_blank" : "_self"}
                  rel="noreferrer"
                  className={tenant.roommate2PhotoUrl ? "profile-pic-hover" : ""}
                  style={{textDecoration: 'none', width: '42px', height: '42px', borderRadius: '6px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}
                >
                  {tenant.roommate2PhotoUrl ? (
                    <img src={tenant.roommate2PhotoUrl} alt={tenant.roommate2Name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>{tenant.roommate2Name.charAt(0).toUpperCase()}</span>
                  )}
                </a>
              </div>
            )}
          </div>
        )}

        <div style={{marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
          <div>
            <div style={{color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem'}}>Initial &rarr; Last Reading</div>
            <div style={{fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.1rem'}}>{tenant.initialMeterReading || 0} <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>&rarr; {tenant.lastMeterReading !== null ? tenant.lastMeterReading : (tenant.initialMeterReading || 0)}</span></div>
          </div>
          <div>
            <div style={{color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem'}}>EB Rate</div>
            <div style={{fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.1rem'}}>₹{tenant.ebRate || 0} <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>/ unit</span></div>
          </div>
          <div>
            <div style={{color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem'}}>Base Rent</div>
            <div style={{fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.1rem'}}>₹{(tenant.rentAmount || 0).toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style={{color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem'}}>Security Deposit</div>
            <div style={{fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.1rem'}}>₹{(tenant.deposit || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <button className="btn btn-success" style={{width: '100%'}} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
