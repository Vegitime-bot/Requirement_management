import React from 'react'
import './globals.css'

export const metadata = {
  title: 'Requirements Management System',
  description: 'Manage product requirements',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="font-sans">{children}</body>
    </html>
  )
}
