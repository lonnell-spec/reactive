'use client'

import { FloatingElements } from '@/components/FloatingElements'
import { GuestForm } from '@/components/GuestForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <FloatingElements />
      <GuestForm />
    </main>
  )
}


