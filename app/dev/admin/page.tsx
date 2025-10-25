'use client'

import { AdminDashboard } from '@/components/AdminDashboard'

// Mock user for development purposes
const mockUser = {
  id: 'dev-admin-user',
  email: 'admin@example.com',
  user_metadata: {
    role: 'admin',
    name: 'Development Admin'
  }
}

export default function DevAdminPage() {
  const handleLogout = () => {
    console.log('Logout clicked in development mode')
  }

  return (
    <AdminDashboard 
      user={mockUser} 
      onLogout={handleLogout} 
    />
  )
}
