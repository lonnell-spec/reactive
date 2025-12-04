'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, CheckCircle } from 'lucide-react'
import { processWorkflowAction } from '@/lib/workflow-actions'

function AutomationWorkflowContent() {
  const searchParams = useSearchParams()
  const action = searchParams.get('action') as 'approve' | 'deny' | null
  const textRefId = searchParams.get('textrefid')
  
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')

  // Validate parameters
  if (!action || !textRefId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                Invalid URL: missing required parameters
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (action !== 'approve' && action !== 'deny') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                Invalid action specified
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleAction = async () => {
    try {
      setProcessing(true)
      setError('')

      const result = await processWorkflowAction(action, textRefId)

      if (!result.success) {
        throw new Error(result.error || 'Failed to process action')
      }

      setSuccess(true)
      setMessage(result.message || `Guest ${action === 'approve' ? 'approved' : 'denied'} successfully`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process action')
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = () => {
    setMessage('Action cancelled')
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600 mt-4">
              You can close this page now.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isApprove = action === 'approve'

  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isApprove ? 'Approve Guest' : 'Deny Guest'}
          </CardTitle>
          <CardDescription>
            {isApprove 
              ? 'Click Approve to confirm this action'
              : 'Click Deny to confirm this action'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {message && !success && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full sm:flex-1"
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              variant="outline"
              className={`w-full sm:flex-1 ${
                isApprove 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'border-red-600 text-red-600 hover:bg-red-50 w-full'
              }`}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                isApprove ? <><CheckCircle className="w-4 h-4 mr-2" /> Approve</> : <><XCircle className="w-4 h-4 mr-2" /> Deny</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AutomationWorkflowPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <p className="text-center mt-4 text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <AutomationWorkflowContent />
    </Suspense>
  )
}
