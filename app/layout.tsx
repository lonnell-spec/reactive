import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: 'Reactive Church Guest Registration',
  description: 'Guest registration system for churches',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}


