import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OAuth Keycloak Demo',
  description: 'Authentication with Keycloak',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
