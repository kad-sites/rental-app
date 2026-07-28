'use client'

export default function QRDisplay({ qrUrl }) {
  const handleDownload = async (e) => {
    if (e) e.preventDefault();
    try {
      // Fetch the image as a blob to bypass cross-origin download restrictions
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'rent-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed, falling back to new tab', error);
      window.open(qrUrl, '_blank');
    }
  }

  return (
    <>
      <div style={{ padding: '1rem', background: 'white', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem' }}>
        <img 
          src={qrUrl} 
          alt="UPI QR Code" 
          onClick={handleDownload}
          style={{ 
            display: 'block',
            width: '200px', 
            height: '200px', 
            margin: '0 auto',
            cursor: 'pointer'
          }} 
          title="Click to download QR code"
        />
      </div>

      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <button 
          onClick={handleDownload} 
          className="btn btn-outline" 
          style={{ 
            display: 'inline-block', 
            padding: '0.6rem 1.2rem', 
            fontSize: '0.9rem', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}
        >
          ⬇️ Download QR Code
        </button>
      </div>
    </>
  )
}
