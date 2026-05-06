'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  generateRecipientBoundInvite,
  getFriendOfCandidates,
} from '@/lib/invite-actions'
import { Copy, Check, AlertCircle, Sparkles } from 'lucide-react'

const formSchema = z.object({
  recipient_name: z.string().min(1, 'Recipient name is required').trim(),
  recipient_phone: z
    .string()
    .min(1, 'Phone is required')
    .refine(val => val.replace(/\D/g, '').length === 10, 'Phone must be 10 digits'),
  friend_of_user_id: z.string().uuid('Choose a friend-of'),
  is_reusable: z.boolean().default(false),
  meeting_with_communicator: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

interface FriendOfCandidate {
  user_id: string
  display_name: string
  is_principal: boolean
}

interface GenerateLinkFormProps {
  user: { id: string; email: string }
}

export function GenerateLinkForm({ user }: GenerateLinkFormProps) {
  const [candidates, setCandidates] = useState<FriendOfCandidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    token: string
    registration_url: string
    sms_sent: boolean
    sms_message?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      is_reusable: false,
      meeting_with_communicator: false,
    },
  })

  const friendOfId = watch('friend_of_user_id')
  const isReusable = watch('is_reusable')
  const meetingWithCommunicator = watch('meeting_with_communicator')

  // Load friend-of candidates and default to current admin if they're in the list
  useEffect(() => {
    let cancelled = false
    getFriendOfCandidates().then(list => {
      if (cancelled) return
      setCandidates(list)
      setCandidatesLoading(false)
      const self = list.find(c => c.user_id === user.id)
      if (self) {
        setValue('friend_of_user_id', self.user_id)
      } else if (list.length > 0) {
        setValue('friend_of_user_id', list[0].user_id)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user.id, setValue])

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    setSubmitting(true)
    try {
      const response = await generateRecipientBoundInvite(
        {
          recipient_name: values.recipient_name,
          recipient_phone: values.recipient_phone,
          friend_of_user_id: values.friend_of_user_id,
          is_reusable: values.is_reusable,
          meeting_with_communicator: values.meeting_with_communicator,
        },
        { id: user.id, email: user.email }
      )
      if (!response.success || !response.data) {
        setSubmitError(response.message || 'Failed to generate invite')
        return
      }
      setResult(response.data)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.registration_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAnother = () => {
    reset({
      recipient_name: '',
      recipient_phone: '',
      friend_of_user_id: friendOfId,
      is_reusable: false,
      meeting_with_communicator: false,
    })
    setResult(null)
    setSubmitError(null)
  }

  if (result) {
    return (
      <Card className="border-2 border-green-600 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Sparkles className="w-5 h-5" />
            Link generated
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Registration link
            </Label>
            <div className="flex gap-2">
              <Input
                value={result.registration_url}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <Alert
            className={
              result.sms_sent
                ? 'border-green-600 bg-green-50'
                : 'border-amber-600 bg-amber-50'
            }
          >
            <AlertDescription
              className={result.sms_sent ? 'text-green-800' : 'text-amber-800'}
            >
              {result.sms_sent
                ? 'SMS sent to the recipient. They will receive the link shortly.'
                : 'SMS could NOT be sent — please copy the link above and share it manually.'}
            </AlertDescription>
          </Alert>

          {result.sms_message && (
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">SMS message</Label>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                {result.sms_message}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleAnother} className="bg-red-600 hover:bg-red-700">
              Generate another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-gray-200 shadow-md">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label htmlFor="recipient_name" className="mb-2 block">
              Recipient name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="recipient_name"
              placeholder="e.g. Bryan Tanaka"
              {...register('recipient_name')}
              disabled={submitting}
            />
            {errors.recipient_name && (
              <p className="text-sm text-red-600 mt-1">
                {errors.recipient_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="recipient_phone" className="mb-2 block">
              Recipient phone <span className="text-red-600">*</span>
            </Label>
            <Input
              id="recipient_phone"
              type="tel"
              placeholder="(555) 123-4567"
              {...register('recipient_phone')}
              disabled={submitting}
            />
            {errors.recipient_phone && (
              <p className="text-sm text-red-600 mt-1">
                {errors.recipient_phone.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              The link will be texted to this number.
            </p>
          </div>

          <div>
            <Label htmlFor="friend_of_user_id" className="mb-2 block">
              Friend of <span className="text-red-600">*</span>
            </Label>
            <Select
              value={friendOfId}
              onValueChange={value => setValue('friend_of_user_id', value)}
              disabled={submitting || candidatesLoading}
            >
              <SelectTrigger id="friend_of_user_id">
                <SelectValue
                  placeholder={candidatesLoading ? 'Loading...' : 'Select a person'}
                />
              </SelectTrigger>
              <SelectContent>
                {candidates.map(c => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.display_name}
                    {c.is_principal && ' — auto-approve'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.friend_of_user_id && (
              <p className="text-sm text-red-600 mt-1">
                {errors.friend_of_user_id.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Determines who reviews and approves this guest.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="is_reusable"
              checked={isReusable}
              onCheckedChange={checked =>
                setValue('is_reusable', checked === true)
              }
              disabled={submitting}
            />
            <div>
              <Label htmlFor="is_reusable" className="cursor-pointer">
                Allow link reuse
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">
                By default, the link dies after one registration. Check only for
                guests who register repeatedly (e.g. recurring family).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="meeting_with_communicator"
              checked={meetingWithCommunicator}
              onCheckedChange={checked =>
                setValue('meeting_with_communicator', checked === true)
              }
              disabled={submitting}
            />
            <div>
              <Label
                htmlFor="meeting_with_communicator"
                className="cursor-pointer"
              >
                Meeting with communicator
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">
                Flag if this guest will be speaking with the communicator after
                service. Appears on the Sunday digest.
              </p>
            </div>
          </div>

          {submitError && (
            <Alert className="border-2 border-red-600 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-800" />
              <AlertDescription className="text-red-800">
                {submitError}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={submitting || candidatesLoading}
          >
            {submitting ? 'Generating...' : 'Generate & send link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
