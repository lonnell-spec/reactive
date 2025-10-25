'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DevPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Development Routes</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main App */}
          <Card className="border-2 border-black shadow-xl">
            <CardHeader className="bg-black text-white">
              <CardTitle>Main Application</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="mb-4">Access the main guest registration form</p>
              <Link href="/" passHref>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Guest Registration Form
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Admin Dashboard */}
          <Card className="border-2 border-black shadow-xl">
            <CardHeader className="bg-black text-white">
              <CardTitle>Admin Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="mb-4">Access the admin dashboard with a mock admin user</p>
              <Link href="/dev/admin" passHref>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Admin Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Status Check */}
          <Card className="border-2 border-black shadow-xl">
            <CardHeader className="bg-black text-white">
              <CardTitle>Status Check</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="mb-4">Access the guest status check page</p>
              <Link href="/dev/status" passHref>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Status Check
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* QR Code Display */}
          <Card className="border-2 border-black shadow-xl">
            <CardHeader className="bg-black text-white">
              <CardTitle>QR Code Display</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="mb-4">View a sample QR code with guest directions</p>
              <Link href="/dev/qrcode" passHref>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  QR Code Display
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Production Routes */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Production Routes</h2>
          <Card className="border-2 border-gray-300">
            <CardContent className="p-6">
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-red-600 hover:underline">
                    / - Guest Registration Form
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="text-red-600 hover:underline">
                    /admin - Admin Dashboard (requires login)
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="text-red-600 hover:underline">
                    /status - Status Check Page
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
