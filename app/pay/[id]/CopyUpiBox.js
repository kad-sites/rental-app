'use client'
import { useState } from 'react'

export default function CopyUpiBox({ upiId }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div 
      onClick={handleCopy}
      style={{
        background: 'rgba(0,0,0,0.05)',
        border: '1px dashed var(--primary-color)',
        borderRadius: '8px',
        padding: '0.75rem',
        marginBottom: '1.5rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
      }}
      title="Click to copy UPI ID"
    >
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
        Tap to copy UPI ID:
      </span>
      <strong style={{ fontSize: '1.1rem', color: 'var(--primary-color)', wordBreak: 'break-all' }}>
        {upiId}
      </strong>
      {copied && (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-success)', marginTop: '0.5rem', fontWeight: 'bold' }}>
          ✓ Copied to clipboard!
        </span>
      )}
    </div>
  )
}
