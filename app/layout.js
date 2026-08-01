import './globals.css'
import Link from 'next/link'

import Navbar from './components/Navbar'

export const metadata = {
  title: 'KirayaPay',
  description: 'Manage rentals, deposits, and WhatsApp invoices easily.',
}

export const viewport = {
  themeColor: '#050505',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
