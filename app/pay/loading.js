export default function PayLoading() {
  return (
    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
      <div className="spinner"></div>
      <style>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(16, 185, 129, 0.1);
          border-radius: 50%;
          border-top-color: var(--primary-color);
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
