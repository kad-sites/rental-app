"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  
  // Hide navbar completely on the tenant payment page
  if (pathname && pathname.startsWith('/pay')) return null;

  return (
    <>
      {/* Top Header */}
      <nav className="navbar" style={{background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)'}}>
        <a href="/" className="logo" style={{display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none'}}>
          <img src="/logo.png" width="40" height="40" alt="Logo" style={{borderRadius: '8px'}} />
          <span style={{fontSize: '1.4rem'}}>
            <span style={{color: 'var(--text-primary)', fontWeight: '400'}}>Kiraya</span>
            <span style={{color: '#feab03', fontWeight: '800'}}>PE</span>
          </span>
        </a>
        
        <div className="nav-links hide-on-mobile">
          <Link href="/" style={{color: pathname === '/' ? 'var(--primary-color)' : ''}}>Dashboard</Link>
          <Link href="/tenants" style={{color: pathname === '/tenants' ? 'var(--primary-color)' : ''}}>Tenants</Link>
          <Link href="/invoices" style={{color: pathname === '/invoices' ? 'var(--primary-color)' : ''}}>Invoices</Link>
          <Link href="/eb" style={{color: pathname === '/eb' ? 'var(--primary-color)' : ''}}>Smart EB</Link>
        </div>
      </nav>

      {/* Bottom Navigation for Mobile */}
      <div className="bottom-nav hide-on-desktop">
        <Link href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Dashboard</span>
        </Link>
        <Link href="/tenants" className={`bottom-nav-item ${pathname === '/tenants' ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Tenants</span>
        </Link>
        <Link href="/invoices" className={`bottom-nav-item ${pathname === '/invoices' ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Invoices</span>
        </Link>
        <Link href="/eb" className={`bottom-nav-item ${pathname === '/eb' ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <span>Smart EB</span>
        </Link>
      </div>
    </>
  )
}
