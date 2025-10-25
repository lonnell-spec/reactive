# 🆕 Two-Stage Approval Workflow - Summary

## What Changed?

Your church guest registration system now includes a **pre-approval step** before requests reach the admin dashboard.

### Old Workflow (Before)
```
Guest Submits → Admin Dashboard → Approve/Deny → QR Code
```

### New Workflow (Now)
```
Guest Submits → Pre-Approver SMS → Approve/Deny
                                         ↓
                                      Approve
                                         ↓
                                   Admin Dashboard → Approve/Deny → QR Code
```

---

## The New Process

### Step 1: Guest Registration
**What happens:**
- Guest fills out the registration form
- System saves their information with status: `pending_pre_approval`

**Guest sees:**
> "Submission received. Your request is pending pre-approval."

---

### Step 2: Pre-Approver Notification
**What happens:**
- Designated person (e.g., Pastor) receives an SMS immediately

**SMS Message:**
```
🔔 2819 CHURCH - Pre-Approval Request

Do you approve granting access to "John Doe" for Sunday 1/15/2025?

This person is requesting to attend as a special guest.

✅ Approve: [clickable link]
❌ Deny: [clickable link]

If approved, they will proceed to admin review.
```

**Pre-Approver Decision:**
- **Click ✅ Approve** → Guest moves to admin dashboard
- **Click ❌ Deny** → Guest is denied and notified immediately

---

### Step 3A: If Pre-Approved ✅

**System Actions:**
1. Guest status changes from `pending_pre_approval` → `pending`
2. Guest receives SMS confirmation:
   ```
   ✅ 2819 CHURCH Update
   
   Hello John! Your guest registration has been pre-approved.
   
   Your request is now being reviewed by our admin team. 
   You'll receive another notification once final approval is complete.
   
   Thank you for your patience!
   ```
3. Request now appears in the **Admin Dashboard** at `/admin`

**Admin Dashboard:**
- Admins see the request and can review all details
- Admins click **Approve** or **Deny** for final decision
- If approved, guest receives QR code and code word

---

### Step 3B: If Pre-Denied ❌

**System Actions:**
1. Guest status changes to `pre_approval_denied`
2. Guest receives SMS notification:
   ```
   ❌ 2819 CHURCH Update
   
   Dear John, we're unable to approve your guest registration at this time.
   
   If you have any questions, please contact our church office.
   
   Blessings,
   2819 CHURCH Team
   ```
3. Process ends - request does NOT appear in admin dashboard

---

## Configuration Required

### Environment Variable
You must set this in Supabase:

```
PRE_APPROVER_PHONE = +12025551234
```

**How to set:**
1. Go to Supabase Dashboard
2. Navigate to: **Settings** → **Edge Functions** → **Secrets**
3. Add new secret named `PRE_APPROVER_PHONE`
4. Enter the phone number with country code
5. Save

**Without this variable:**
- System will log pre-approval requests but not send SMS
- Requests will stay in `pending_pre_approval` status
- Admin dashboard will be empty (only shows `pending` status)

---

## Benefits of This Workflow

### 1. **Security Enhancement**
- Adds an extra layer of vetting before admin review
- Designated person can quickly deny suspicious requests

### 2. **Pastoral Oversight**
- Key church leader (e.g., Pastor) has visibility into all guest requests
- Can provide immediate approval for known guests

### 3. **Reduced Admin Workload**
- Only pre-approved requests reach admin dashboard
- Admins don't see denied or pending pre-approval requests

### 4. **Quick Response**
- Pre-approver can act immediately via SMS (no login required)
- Guests get faster feedback on their request status

### 5. **Audit Trail**
- System tracks who pre-approved (`preApprovedBy`)
- Timestamps for all stages (`preApprovedAt`)

---

## Testing the New Workflow

### Test Checklist

1. **Configure Environment**
   - [ ] Set `PRE_APPROVER_PHONE` in Supabase
   - [ ] Deploy updated server function: `supabase functions deploy server`

2. **Submit Test Registration**
   - [ ] Go to your site (e.g., https://your-site.vercel.app)
   - [ ] Fill out guest registration form
   - [ ] Submit registration

3. **Check Pre-Approver SMS**
   - [ ] Pre-approver receives SMS within 30 seconds
   - [ ] SMS contains guest name and date
   - [ ] SMS includes two clickable links (Approve/Deny)

4. **Test Approval Flow**
   - [ ] Click the **Approve** link
   - [ ] See confirmation page in browser
   - [ ] Guest receives pre-approval SMS
   - [ ] Check `/admin` dashboard - request should appear

5. **Test Final Approval**
   - [ ] Log into admin dashboard at `/admin`
   - [ ] Find the pre-approved request
   - [ ] Click **Approve**
   - [ ] Verify guest receives QR code via SMS

6. **Test Denial Flow**
   - [ ] Submit another test registration
   - [ ] Click the **Deny** link in pre-approver SMS
   - [ ] See denial confirmation page
   - [ ] Guest receives denial SMS
   - [ ] Verify request does NOT appear in admin dashboard

---

## Troubleshooting

### Issue: Pre-Approver Not Receiving SMS

**Check:**
1. `PRE_APPROVER_PHONE` is set correctly in Supabase
2. Phone number includes country code (e.g., `+1` for US)
3. TextMagic credentials are valid
4. Check server logs for errors

**Test:**
```bash
# Check environment in Supabase Dashboard
Settings → Edge Functions → Configuration
Verify PRE_APPROVER_PHONE exists
```

---

### Issue: Request Not Appearing in Admin Dashboard

**Check:**
1. Did pre-approver click the **Approve** link?
2. Check submission status (should be `pending` not `pending_pre_approval`)
3. Verify admin dashboard filter includes `pending` status

**Debug:**
- Check browser console for errors
- Review server logs in Supabase
- Use the System Check tool in admin dashboard

---

### Issue: Links Not Working

**Check:**
1. Edge functions are deployed: `supabase functions deploy server`
2. Function is running - test health endpoint
3. Submission ID is valid

**Test Health Endpoint:**
```
https://YOUR_PROJECT.supabase.co/functions/v1/make-server-66bf82e5/health
```

---

## Who Should Be the Pre-Approver?

**Recommended:**
- Senior Pastor
- Church Administrator
- Security Director
- Someone with pastoral oversight

**Considerations:**
- Must respond quickly to SMS (ideally same day)
- Familiar with church members and regular attendees
- Available during church office hours
- Understands church security protocols

**Best Practice:**
- Set up group SMS if multiple people should review
- Document the process in church leadership handbook
- Train pre-approver on approval criteria

---

## Quick Reference

### Guest Statuses

| Status | Meaning | Next Step |
|--------|---------|-----------|
| `pending_pre_approval` | Just submitted | Waiting for pre-approver |
| `pre_approval_denied` | Pre-approver denied | Process ends |
| `pending` | Pre-approved | Admin dashboard review |
| `approved` | Admin approved | QR code sent |
| `denied` | Admin denied | Process ends |

---

### SMS Templates

**Pre-Approval Request:**
```
🔔 2819 CHURCH - Pre-Approval Request

Do you approve granting access to "[Name]" for Sunday [Date]?

This person is requesting to attend as a special guest.

✅ Approve: [link]
❌ Deny: [link]

If approved, they will proceed to admin review.
```

**Pre-Approved Notification (to guest):**
```
✅ 2819 CHURCH Update

Hello [Name]! Your guest registration has been pre-approved.

Your request is now being reviewed by our admin team. 
You'll receive another notification once final approval is complete.

Thank you for your patience!
```

**Pre-Denied Notification (to guest):**
```
❌ 2819 CHURCH Update

Dear [Name], we're unable to approve your guest registration at this time.

If you have any questions, please contact our church office.

Blessings,
2819 CHURCH Team
```

---

## Next Steps

1. ✅ **Read this document** - You're doing it now!
2. ⭐ **Set `PRE_APPROVER_PHONE`** - Critical first step
3. 🚀 **Deploy the updated function** - `supabase functions deploy server`
4. 🧪 **Test the workflow** - Use the test checklist above
5. 📚 **Train your team** - Share this document with admins
6. 🎉 **Go live!** - Start using the new workflow

---

## Support

For detailed setup instructions, see: **PRE_APPROVAL_SETUP.md**

For deployment help, see: **DEPLOYMENT_GUIDE.md**

For overall system status, see: **STATUS.md**

---

**Questions?** Review the documentation files or contact your technical administrator.

Good luck with your deployment! 🙏
