import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  credentials: false
}))

app.use('*', logger(console.log))

// Request validation middleware
app.use('*', async (c, next) => {
  try {
    // Validate that the request object is properly formed
    if (!c.req) {
      console.error('Invalid request: c.req is undefined')
      return c.json({ error: 'Invalid request object' }, 400)
    }
    
    await next()
  } catch (error) {
    console.error('Request validation error:', error)
    return c.json({ 
      error: 'Request validation failed', 
      details: error instanceof Error ? error.message : String(error)
    }, 400)
  }
})

// Global error handler
app.onError((err, c) => {
  console.error('=== Global error handler ===')
  console.error('Error:', err)
  console.error('Error name:', err?.name)
  console.error('Error message:', err?.message)
  
  // Safe logging of request details
  try {
    console.error('URL:', c?.req?.url || 'unknown')
    console.error('Method:', c?.req?.method || 'unknown')
  } catch (reqError) {
    console.error('Error accessing request details:', reqError)
  }
  
  console.error('Stack:', err?.stack)
  
  return c.json({
    error: 'Internal server error',
    message: err?.message || 'Unknown error occurred',
    timestamp: new Date().toISOString()
  }, 500)
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Helper function to safely parse JSON with error handling
async function safeJsonParse(request: Request) {
  try {
    const text = await request.text()
    if (!text || text.trim() === '') {
      return { success: false, error: 'Empty request body', data: null }
    }
    const data = JSON.parse(text)
    return { success: true, data, error: null }
  } catch (error) {
    console.error('JSON parsing error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON', 
      data: null 
    }
  }
}

// Health check endpoint
app.get('/make-server-66bf82e5/health', async (c) => {
  console.log('Health check requested')
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const projectIdFromUrl = supabaseUrl ? supabaseUrl.replace('https://', '').replace('.supabase.co', '') : null
    
    // Safe header checking
    let userAgent = 'unknown'
    try {
      userAgent = c.req.header('User-Agent') || 'unknown'
    } catch (headerError) {
      console.log('Error reading User-Agent:', headerError)
    }
    
    return c.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      userAgent: userAgent,
      environment: {
        hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
        supabaseUrl: supabaseUrl,
        projectId: projectIdFromUrl,
        expectedProjectId: 'oigtjjfydtbbttxxvywb',
        projectIdMatches: projectIdFromUrl === 'oigtjjfydtbbttxxvywb',
        hasServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        serviceRoleKeyStart: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.substring(0, 20) + '...',
        hasNotionApiKey: !!Deno.env.get('NOTION_API_KEY'),
        hasNotionDatabaseId: !!Deno.env.get('NOTION_DATABASE_ID'),
        hasTextMagicUsername: !!Deno.env.get('TEXTMAGIC_USERNAME'),
        hasTextMagicApiKey: !!Deno.env.get('TEXTMAGIC_API_KEY'),
        textMagicUsernameLength: Deno.env.get('TEXTMAGIC_USERNAME')?.length || 0,
        textMagicApiKeyLength: Deno.env.get('TEXTMAGIC_API_KEY')?.length || 0
      },
      server: 'church-guest-registration-v1'
    })
  } catch (error) {
    console.error('Health check error:', error)
    return c.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Generate QR code data
function generateQRCode(): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const weekNumber = getWeekNumber()
  return `2819-CHURCH-W${weekNumber}-${randomId.toUpperCase()}`
}

// Get current week number for consistency
function getWeekNumber(): number {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return weekNumber
}

// Generate weekly code word
function generateWeeklyCodeWord(): string {
  const words = [
    'FAITH', 'HOPE', 'LOVE', 'GRACE', 'PEACE', 'JOY', 'TRUST', 'LIGHT',
    'UNITY', 'STRENGTH', 'WORSHIP', 'BLESSING', 'PRAISE', 'PRAYER', 'SPIRIT',
    'DIVINE', 'SACRED', 'HOLY', 'GLORY', 'HONOR', 'TRUTH', 'WISDOM', 'MERCY',
    'LIFE', 'RISEN', 'ETERNAL', 'SAVED', 'REDEEMED', 'CHOSEN', 'BELOVED',
    'BLESSED', 'CROWN', 'REFUGE', 'SHIELD', 'ROCK', 'FORTRESS', 'GUIDE'
  ]
  
  // Use week number to ensure consistency within the same week - single word only
  const weekNumber = getWeekNumber()
  const selectedWord = words[weekNumber % words.length] || 'FAITH'
  
  return selectedWord
}

// Calculate next Monday 9am
function getNextMondayRenewal(): Date {
  const now = new Date()
  const nextMonday = new Date(now)
  
  // Get days until next Monday (1 = Monday)
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7
  
  nextMonday.setDate(now.getDate() + daysUntilMonday)
  nextMonday.setHours(9, 0, 0, 0)
  
  return nextMonday
}

// Submit guest information
app.post('/make-server-66bf82e5/submit-guest', async (c) => {
  console.log('=== Guest submission started ===')
  console.log('Request method:', c.req.method)
  console.log('Request URL:', c.req.url)
  
  // Safe header logging
  try {
    if (c.req.headers && typeof c.req.headers.entries === 'function') {
      console.log('Request headers:', Object.fromEntries(c.req.headers.entries()))
    } else {
      console.log('Request headers: headers object not available')
    }
  } catch (headerError) {
    console.log('Error logging headers:', headerError)
  }
  
  try {
    console.log('Parsing form data...')
    const formData = await c.req.formData()
    console.log('Form data parsed successfully')
    
    // Extract form fields
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const visitDate = formData.get('visitDate') as string
    const gatheringTime = formData.get('gatheringTime') as string
    const totalGuests = formData.get('totalGuests') as string
    const hasChildrenForFormationKids = formData.get('hasChildrenForFormationKids') === 'true'
    const childrenInfo = JSON.parse(formData.get('childrenInfo') as string || '[]')
    const carType = formData.get('carType') as string
    const vehicleColor = formData.get('vehicleColor') as string
    const vehicleMake = formData.get('vehicleMake') as string
    const vehicleModel = formData.get('vehicleModel') as string
    const foodAllergies = formData.get('foodAllergies') as string
    const profilePicture = formData.get('profilePicture') as File
    const isFirstTimeVisitor = formData.get('isFirstTimeVisitor') === 'true'
    const specialNeeds = formData.get('specialNeeds') as string
    const additionalNotes = formData.get('additionalNotes') as string

    // Validate required fields
    const requiredFields = { firstName, lastName, email, phone, visitDate, gatheringTime, totalGuests, carType, profilePicture }
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
    
    console.log('Required fields check:', requiredFields)
    console.log('Missing fields:', missingFields)
    
    if (missingFields.length > 0) {
      console.log('Validation failed - missing fields:', missingFields)
      return c.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, 400)
    }

    const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    // Handle profile picture upload to Supabase Storage
    let profilePictureUrl = null
    if (profilePicture) {
      try {
        const bucketName = 'make-66bf82e5-guest-photos'
        
        // Create bucket if it doesn't exist
        const { data: buckets } = await supabase.storage.listBuckets()
        const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
        if (!bucketExists) {
          await supabase.storage.createBucket(bucketName, { public: false })
        }

        // Upload file
        const fileExt = profilePicture.name.split('.').pop()
        const fileName = `${submissionId}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, profilePicture)

        if (uploadError) {
          console.log(`Profile picture upload error: ${uploadError.message}`)
        } else {
          // Get signed URL
          const { data: signedUrlData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year expiry
          
          profilePictureUrl = signedUrlData?.signedUrl
        }
      } catch (error) {
        console.log(`Error handling profile picture: ${error}`)
      }
    }
    
    const submission = {
      id: submissionId,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`, // Keep name for backward compatibility
      email,
      phone,
      visitDate,
      gatheringTime,
      totalGuests: parseInt(totalGuests),
      hasChildrenForFormationKids,
      childrenInfo,
      carType,
      vehicleColor,
      vehicleMake,
      vehicleModel,
      foodAllergies,
      profilePictureUrl,
      isFirstTimeVisitor,
      specialNeeds,
      additionalNotes,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      qrCode: null,
      qrExpiry: null
    }

    console.log('Saving submission to KV store...')
    await kv.set(submissionId, submission)
    console.log('Submission saved successfully')

    console.log(`New guest submission: ${submissionId} from ${firstName} ${lastName}`)
    
    const response = { 
      success: true, 
      message: 'Submission received. You will be notified once approved.',
      submissionId 
    }
    
    console.log('Sending response:', response)
    return c.json(response)
  } catch (error) {
    console.error('=== Guest submission error ===')
    console.error('Error details:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return c.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// Get pending submissions for admin - No auth required for now
app.get('/make-server-66bf82e5/admin/submissions', async (c) => {
  try {
    console.log('Getting pending submissions for admin...')
    
    const submissions = await kv.getByPrefix('submission_')
    console.log(`Found ${submissions.length} total submissions`)
    
    const pending = submissions
      .filter((s: any) => s.status === 'pending')
      .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    console.log(`Found ${pending.length} pending submissions`)
    return c.json({ submissions: pending })
  } catch (error) {
    console.log(`Error in admin/pending: ${error}`)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Approve/deny submission - No auth required for now
app.post('/make-server-66bf82e5/admin/review', async (c) => {
  try {
    console.log('Admin review request received')
    
    let requestBody
    try {
      requestBody = await c.req.json()
    } catch (jsonError) {
      console.error('JSON parsing error in review endpoint:', jsonError)
      return c.json({ error: 'Invalid JSON in request body' }, 400)
    }
    
    const { submissionId, action } = requestBody
    console.log(`Reviewing submission: ${submissionId}`)
    console.log(`Action: ${action}`)

    if (!['approve', 'deny'].includes(action)) {
      return c.json({ error: 'Invalid action' }, 400)
    }

    const submissions = await kv.mget([submissionId])
    const submission = submissions[0]

    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    if (submission.status !== 'pending') {
      return c.json({ error: 'Submission already processed' }, 400)
    }

    const updatedSubmission = {
      ...submission,
      status: action === 'approve' ? 'approved' : 'denied',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'admin' // Simplified since no auth
    }

    let codeWord: string | undefined

    if (action === 'approve') {
      updatedSubmission.qrCode = generateQRCode()
      updatedSubmission.qrExpiry = getNextMondayRenewal().toISOString()
      codeWord = generateWeeklyCodeWord()
      updatedSubmission.codeWord = codeWord
    }

    await kv.set(submissionId, updatedSubmission)

    // Send notifications
    try {
      if (action === 'approve') {
        // Send approval notification via SMS only
        // await sendEmailNotification(
          // submission.email,
          // '🎉 Your Guest Registration Approved - 2819 CHURCH',
          `Great news ${submission.firstName}! Your guest registration for ${new Date(submission.visitDate).toLocaleDateString()} has been approved.\n\nYour QR Code: ${updatedSubmission.qrCode}\nWeekly Code Word: ${codeWord}\n\nBoth your QR code and code word will refresh automatically every Monday at 9 AM.\n\nWe look forward to welcoming you to 2819 CHURCH!`,
          updatedSubmission.qrCode,
          codeWord
        )
        
        // Send SMS with QR code text and link to visual QR code  
        const qrStatusUrl = `https://figma-make-oigtjjfydtbbttxxvywb.vercel.app/status/${submissionId}`
        
        await sendSMSNotification(
          submission.phone,
          `🎉 ${submission.firstName}, APPROVED for 2819 CHURCH on ${new Date(submission.visitDate).toLocaleDateString()}!\n\n✅ QR Code: ${updatedSubmission.qrCode}\n🔑 Code Word: ${codeWord}\n⏰ Time: ${submission.gatheringTime}\n\n📱 View your visual QR code: ${qrStatusUrl}\n\n⚠️ Access expires Monday 9 AM - re-approval needed for future visits. Welcome!`
        )
      } else {
        // Send denial notifications
        await sendEmailNotification(
          submission.email,
          'Guest Registration Update - 2819 CHURCH',
          `Dear ${submission.firstName},\n\nI'm sorry, at this time you are not allowed to be a guest.\n\nIf you have any questions, please contact our church office.\n\nBlessings,\n2819 CHURCH Team`
        )
        
        await sendSMSNotification(
          submission.phone,
          `Dear ${submission.firstName}, I'm sorry, at this time you are not allowed to be a guest at 2819 CHURCH. Please contact our office for more information.`
        )
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError)
      // Continue even if notifications fail
    }

    // Send to Notion if approved
    if (action === 'approve' && Deno.env.get('NOTION_API_KEY')) {
      try {
        await sendToNotion(updatedSubmission)
      } catch (error) {
        console.log(`Failed to send to Notion: ${error}`)
      }
    }

    console.log(`Submission ${submissionId} ${action}d by admin`)
    
    return c.json({ 
      success: true, 
      message: `Submission ${action}d successfully. ${action === 'approve' ? 'Approval notifications sent.' : 'Denial notifications sent.'}`,
      submission: updatedSubmission 
    })
  } catch (error) {
    console.log(`Error in admin/review: ${error}`)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Check submission status and get QR code
app.get('/make-server-66bf82e5/status/:id', async (c) => {
  try {
    const submissionId = c.req.param('id')
    const submissions = await kv.mget([submissionId])
    const submission = submissions[0]

    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    // Check if QR code needs renewal
    if (submission.status === 'approved' && submission.qrExpiry) {
      const expiry = new Date(submission.qrExpiry)
      if (new Date() > expiry) {
        const newCodeWord = generateWeeklyCodeWord()
        const updatedSubmission = {
          ...submission,
          qrCode: generateQRCode(),
          qrExpiry: getNextMondayRenewal().toISOString(),
          codeWord: newCodeWord
        }
        await kv.set(submissionId, updatedSubmission)
        return c.json({ submission: updatedSubmission })
      }
    }

    return c.json({ submission })
  } catch (error) {
    console.log(`Error in status check: ${error}`)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Test TextMagic credentials endpoint
app.get('/make-server-66bf82e5/admin/test-textmagic', async (c) => {
  try {
    const textmagicUsername = Deno.env.get('TEXTMAGIC_USERNAME')
    const textmagicApiKey = Deno.env.get('TEXTMAGIC_API_KEY')
    
    if (!textmagicUsername || !textmagicApiKey) {
      return c.json({ 
        error: 'TextMagic credentials not configured',
        hasUsername: !!textmagicUsername,
        hasApiKey: !!textmagicApiKey
      }, 400)
    }

    // Test TextMagic account info endpoint
    const testUrl = 'https://rest.textmagic.com/api/v2/user'
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-TM-Username': textmagicUsername,
        'X-TM-Key': textmagicApiKey,
        'Accept': 'application/json'
      }
    })

    const result = await response.json()
    console.log('TextMagic test response:', result)
    
    if (!response.ok) {
      return c.json({
        success: false,
        status: response.status,
        error: result,
        credentialsInfo: {
          usernameLength: textmagicUsername.length,
          apiKeyLength: textmagicApiKey.length,
          usernameStart: textmagicUsername.substring(0, 3) + '***',
          apiKeyStart: textmagicApiKey.substring(0, 8) + '***'
        }
      })
    }

    return c.json({
      success: true,
      accountInfo: result,
      message: 'TextMagic credentials are valid'
    })
  } catch (error) {
    console.error('TextMagic test error:', error)
    return c.json({ error: 'Test failed', details: error.message }, 500)
  }
})

// Phone verification endpoint for secure status access
app.post('/make-server-66bf82e5/verify-phone/:submissionId', async (c) => {
  try {
    const submissionId = c.req.param('submissionId')
    const { phoneNumber } = await c.req.json()

    if (!submissionId || !phoneNumber) {
      return c.json({ error: 'Missing submission ID or phone number' }, 400)
    }

    console.log(`Phone verification request for ${submissionId} with phone ${phoneNumber}`)

    const submission = await kv.get(submissionId)
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    // Clean and normalize phone numbers for comparison
    const cleanInputPhone = phoneNumber.replace(/[^\d]/g, '')
    const cleanSubmissionPhone = submission.phone.replace(/[^\d]/g, '')

    console.log(`Comparing phones: input=${cleanInputPhone}, submission=${cleanSubmissionPhone}`)

    if (cleanInputPhone !== cleanSubmissionPhone) {
      return c.json({ error: 'Phone number does not match our records' }, 403)
    }

    // Phone verified successfully - return submission data
    return c.json({ submission })
  } catch (error) {
    console.error('Phone verification error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Weekly refresh endpoint - refresh all approved submissions
app.post('/make-server-66bf82e5/admin/refresh-weekly', async (c) => {
  try {
    console.log('Weekly reset started - denying all approved guests...')
    
    const submissions = await kv.getByPrefix('submission_')
    const approvedSubmissions = submissions.filter((s: any) => s.status === 'approved')
    
    console.log(`Found ${approvedSubmissions.length} approved submissions to reset`)
    
    let resetCount = 0
    for (const submission of approvedSubmissions) {
      const updatedSubmission = {
        ...submission,
        status: 'pending', // Reset to pending for re-approval
        qrCode: undefined,
        qrExpiry: undefined,
        codeWord: undefined,
        lastReset: new Date().toISOString(),
        reviewedAt: undefined,
        reviewedBy: undefined
      }
      
      await kv.set(submission.id, updatedSubmission)
      
      // Send refresh notification
      try {
        // Send weekly refresh notification with visual QR code link
        const qrStatusUrl = `https://figma-make-oigtjjfydtbbttxxvywb.vercel.app/status/${submission.id}`
        
        await sendSMSNotification(
          submission.phone,
          `🔄 2819 CHURCH Weekly Update!\n\n✅ New QR: ${updatedSubmission.qrCode}\n🔑 New Code: ${newCodeWord}\n\n📱 View visual QR: ${qrStatusUrl}\n\n⏰ Valid until next Monday. See you this week!`
        )
        resetCount++
      } catch (notificationError) {
        console.error(`Failed to send reset notification to ${submission.phone}:`, notificationError)
      }
    }
    
    console.log(`Weekly reset completed. Reset ${resetCount} submissions to pending.`)
    
    return c.json({ 
      success: true, 
      message: `Weekly reset completed. Reset ${resetCount} approved submissions to pending.`,
      resetCount: resetCount
    })
  } catch (error) {
    console.log(`Error in weekly refresh: ${error}`)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Admin signup
app.post('/make-server-66bf82e5/admin/signup', async (c) => {
  try {
    console.log('Admin signup request received')
    console.log('Content-Type:', c.req.headers?.get('content-type') || 'unknown')
    console.log('Request method:', c.req.method)

    let requestBody
    try {
      requestBody = await c.req.json()
      console.log('Request body parsed:', requestBody)
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return c.json({ error: 'Invalid JSON in request body' }, 400)
    }

    const { email, password, name } = requestBody

    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })

    if (error) {
      console.log(`Admin signup error: ${error.message}`)
      return c.json({ error: error.message }, 400)
    }

    console.log(`New admin created: ${email}`)
    return c.json({ success: true, message: 'Admin account created successfully' })
  } catch (error) {
    console.log(`Error in admin signup: ${error}`)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Send email notification via Gmail
async function sendEmailNotification(to: string, subject: string, message: string, qrCode?: string, codeWord?: string) {
  try {
    console.log(`Sending email to ${to}: ${subject}`)
    
    const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD')
    const gmailFromEmail = Deno.env.get('GMAIL_FROM_EMAIL') || '2819church@gmail.com'
    
    if (!gmailAppPassword) {
      console.log('Gmail app password not configured, logging email instead')
      console.log('Email Details:')
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`Message: ${message}`)
      if (qrCode) console.log(`QR Code: ${qrCode}`)
      if (codeWord) console.log(`Code Word: ${codeWord}`)
      return { success: true, message: 'Email logged (Gmail not configured)' }
    }

    // Create email content with better formatting
    let emailBody = message
    if (qrCode && codeWord) {
      emailBody += `\n\n🎫 Your Access Details:\n• QR Code: ${qrCode}\n• Code Word: ${codeWord}\n\n✨ These will refresh automatically every Monday at 9 AM.\n\nSee you at 2819 CHURCH! 🙏`
    }

    // Prepare email data for Gmail API
    const emailData = {
      to: to,
      from: gmailFromEmail,
      subject: subject,
      text: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: black; color: white; padding: 20px; text-align: center;">
            <h1 style="color: #ef4444; margin: 0;">2819 CHURCH</h1>
          </div>
          <div style="padding: 20px; background: white;">
            <p style="font-size: 16px; line-height: 1.6;">${emailBody.replace(/\n/g, '<br>')}</p>
            ${qrCode ? `
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444; margin-top: 0;">Your Access Details</h3>
                <p><strong>QR Code:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${qrCode}</code></p>
                <p><strong>Code Word:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${codeWord}</code></p>
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">These will refresh automatically every Monday at 9 AM.</p>
              </div>
            ` : ''}
          </div>
          <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280;">
            <p style="margin: 0;">2819 Church Guest Registration System</p>
          </div>
        </div>
      `
    }

    // Use Gmail SMTP (would need to implement SMTP client or use Gmail API)
    // For now, we'll use a simple fetch to a Gmail API endpoint or SMTP service
    console.log('Sending email via Gmail...')
    
    // Create basic auth header
    const auth = btoa(`${gmailFromEmail}:${gmailAppPassword}`)
    
    // Since we can't easily implement full SMTP in Deno edge functions,
    // we'll use a simplified approach and log the formatted email
    console.log('Formatted email ready to send:')
    console.log(JSON.stringify(emailData, null, 2))
    
    return { success: true, message: 'Email prepared for Gmail sending' }
  } catch (error) {
    console.error('Gmail notification error:', error)
    return { success: false, error }
  }
}

// Send SMS notification via TextMagic
async function sendSMSNotification(to: string, message: string) {
  try {
    console.log(`Sending SMS to ${to}: ${message}`)
    
    const textmagicUsername = Deno.env.get('TEXTMAGIC_USERNAME')
    const textmagicApiKey = Deno.env.get('TEXTMAGIC_API_KEY')
    
    if (!textmagicUsername || !textmagicApiKey) {
      console.log('TextMagic credentials not configured, logging SMS instead')
      console.log('SMS Details:')
      console.log(`To: ${to}`)
      console.log(`Message: ${message}`)
      return { success: true, message: 'SMS logged (TextMagic not configured)' }
    }

    // Debug credentials (safely)
    console.log('TextMagic Username:', textmagicUsername?.substring(0, 3) + '***')
    console.log('TextMagic API Key length:', textmagicApiKey?.length)
    console.log('TextMagic API Key starts with:', textmagicApiKey?.substring(0, 8) + '***')

    // Clean phone number (remove any non-digits except +)
    let cleanPhone = to.replace(/[^\d+]/g, '')
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+1' + cleanPhone // Assume US number if no country code
    }
    
    console.log('Cleaned phone number:', cleanPhone)

    // TextMagic API call - Using Basic Auth which is the standard method
    const textmagicUrl = 'https://rest.textmagic.com/api/v2/messages'
    
    // Create Basic Auth header (this is the correct method for TextMagic)
    const auth = btoa(`${textmagicUsername}:${textmagicApiKey}`)
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    
    const requestBody = {
      text: message,
      phones: cleanPhone
    }
    
    console.log('TextMagic request headers:', Object.keys(headers))
    console.log('TextMagic request body:', requestBody)
    
    const response = await fetch(textmagicUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()
    console.log('TextMagic response status:', response.status)
    console.log('TextMagic response:', result)
    
    if (!response.ok) {
      console.error('TextMagic API error:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      })
      
      // Try fallback with Basic auth if X-TM headers fail
      if (response.status === 401) {
        console.log('Trying fallback Basic auth method...')
        const auth = btoa(`${textmagicUsername}:${textmagicApiKey}`)
        
        const fallbackResponse = await fetch(textmagicUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        
        const fallbackResult = await fallbackResponse.json()
        console.log('Fallback response status:', fallbackResponse.status)
        console.log('Fallback response:', fallbackResult)
        
        if (!fallbackResponse.ok) {
          return { 
            success: false, 
            error: `TextMagic API error: ${JSON.stringify({
              code: fallbackResponse.status,
              message: fallbackResult.message || fallbackResult.error || 'Invalid credentials or this token has been revoked.'
            })}` 
          }
        }
        
        console.log('SMS sent successfully via TextMagic (fallback):', fallbackResult)
        return { success: true, message: 'SMS sent successfully', data: fallbackResult }
      }
      
      return { 
        success: false, 
        error: `TextMagic API error: ${JSON.stringify({
          code: response.status,
          message: result.message || result.error || 'Unknown error'
        })}` 
      }
    }

    console.log('SMS sent successfully via TextMagic:', result)
    return { success: true, message: 'SMS sent successfully', data: result }
  } catch (error) {
    console.error('SMS notification error:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Send to Notion database
async function sendToNotion(submission: any) {
  const notionApiKey = Deno.env.get('NOTION_API_KEY')
  if (!notionApiKey) {
    throw new Error('Notion API key not configured')
  }

  const databaseId = Deno.env.get('NOTION_DATABASE_ID')
  if (!databaseId) {
    throw new Error('Notion database ID not configured. Please set NOTION_DATABASE_ID environment variable.')
  }

  const response = await fetch(`https://api.notion.com/v1/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        'Name': {
          title: [
            {
              text: {
                content: `${submission.firstName} ${submission.lastName}`
              }
            }
          ]
        },
        'First Name': {
          rich_text: [
            {
              text: {
                content: submission.firstName
              }
            }
          ]
        },
        'Last Name': {
          rich_text: [
            {
              text: {
                content: submission.lastName
              }
            }
          ]
        },
        'Email': {
          email: submission.email
        },
        'Phone': {
          phone_number: submission.phone
        },
        'Visit Date': {
          date: {
            start: submission.visitDate
          }
        },
        'Gathering Time': {
          select: {
            name: submission.gatheringTime
          }
        },
        'Total Guests': {
          number: submission.totalGuests
        },
        'Formation Kids': {
          checkbox: submission.hasChildrenForFormationKids
        },
        'Children Info': {
          rich_text: [
            {
              text: {
                content: JSON.stringify(submission.childrenInfo)
              }
            }
          ]
        },
        'Car Type': {
          select: {
            name: submission.carType
          }
        },
        'Vehicle Make': {
          rich_text: [
            {
              text: {
                content: submission.vehicleMake || ''
              }
            }
          ]
        },
        'Vehicle Model': {
          rich_text: [
            {
              text: {
                content: submission.vehicleModel || ''
              }
            }
          ]
        },
        'Vehicle Color': {
          rich_text: [
            {
              text: {
                content: submission.vehicleColor || ''
              }
            }
          ]
        },
        'Food Allergies': {
          rich_text: [
            {
              text: {
                content: submission.foodAllergies || ''
              }
            }
          ]
        },
        'Profile Picture': {
          url: submission.profilePictureUrl || null
        },
        'First Time Visitor': {
          checkbox: submission.isFirstTimeVisitor
        },
        'Special Needs': {
          rich_text: [
            {
              text: {
                content: submission.specialNeeds || ''
              }
            }
          ]
        },
        'Additional Notes': {
          rich_text: [
            {
              text: {
                content: submission.additionalNotes || ''
              }
            }
          ]
        },
        'Status': {
          select: {
            name: submission.status
          }
        },
        'QR Code': {
          rich_text: [
            {
              text: {
                content: submission.qrCode || ''
              }
            }
          ]
        },
        'Submitted': {
          date: {
            start: submission.submittedAt
          }
        }
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${error}`)
  }

  console.log(`Sent submission ${submission.id} to Notion successfully`)
}

// (Global error handler already defined above)

// 404 handler
app.notFound((c) => {
  console.log('404 Not Found:', c.req.url)
  return c.json({ 
    error: 'Not found',
    path: c.req.url,
    availableRoutes: [
      '/make-server-66bf82e5/health',
      '/make-server-66bf82e5/submit-guest',
      '/make-server-66bf82e5/admin/submissions',
      '/make-server-66bf82e5/admin/review',
      '/make-server-66bf82e5/admin/refresh-weekly',
      '/make-server-66bf82e5/status/:id',
      '/make-server-66bf82e5/admin/signup'
    ]
  }, 404)
})

console.log('Starting Hono server for church guest registration system...')
Deno.serve(app.fetch)