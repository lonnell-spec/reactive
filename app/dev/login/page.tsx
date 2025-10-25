'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function DevLoginPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple validation for development
    if (email === 'admin@example.com' && password === 'password123') {
      // In a real app, this would set cookies or local storage
      console.log('Development login successful')
      router.push('/dev/admin')
    } else {
      setError('Invalid credentials. Use admin@example.com / password123')
    }
  }

  return (
    <div className="min-h-screen bg-white p-8 flex items-center justify-center">
      <Card className="w-full max-w-md border-2 border-black shadow-xl">
        <CardHeader className="bg-black text-white">
          <CardTitle className="text-xl">Development Admin Login</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <Alert className="mb-6 border-2 border-red-600 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 border-gray-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-2 border-gray-300"
              />
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Login
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Use these development credentials:</p>
              <p><strong>Email:</strong> admin@example.com</p>
              <p><strong>Password:</strong> password123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
