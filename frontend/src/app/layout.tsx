import './globals.css'

export const metadata = {
  title: 'Crypto Analytics Dashboard',
  description: 'Real-time cryptocurrency social analytics',
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
