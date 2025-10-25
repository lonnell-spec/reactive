'use client'

import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DevQRCodePage() {
  // Sample guest info
  const guestInfo = {
    firstName: 'John',
    lastName: 'Doe'
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <Card className="border-2 border-black shadow-xl">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-xl">Development QR Code Display</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center">
            <QRCodeDisplay 
              value="guest:dev-12345:1698504000000" 
              size={200} 
              guestInfo={guestInfo}
              showDirections={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
