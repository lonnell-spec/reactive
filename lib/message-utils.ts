'use server'

import { formatDateString } from './date-utils';

/**
 * Guest information interface for message formatting
 */
interface GuestInfo {
  first_name: string;
  last_name: string;
  visit_date: string;
  gathering_time: string;
  total_guests: number;
  status: GuestStatus;
}

/**
 * Formats a pre-approver notification message
 * Pure function for testability
 * 
 * @param guest Guest information
 * @param deepLinkUrl URL for the admin deep link
 * @param approvalUrl URL for the approval action
 * @param denialUrl URL for the denial action
 * @returns Formatted message string
 */
export async function formatPreApproverMessage(
  guest: GuestInfo,
  deepLinkUrl: string,
  approvalUrl: string,
  denialUrl: string
): Promise<string> {
  if (!guest || !deepLinkUrl || !approvalUrl || !denialUrl) {
    throw new Error('Guest information and URLs are required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
New guest registration requires pre-approval:
Name: ${guest.first_name} ${guest.last_name?.charAt(0)?.toUpperCase() || ''}.
Visit Date: ${formattedDate}
Time: ${guest.gathering_time}
Guests: ${guest.total_guests}

Approve: ${approvalUrl}

Deny: ${denialUrl}

Guest details at: ${deepLinkUrl}
`.trim();
}

/**
 * Formats an approver notification message
 * Pure function for testability
 * 
 * @param guest Guest information
 * @param deepLinkUrl URL for deep link to a guest detail
 * @param approvalUrl URL for the approval action
 * @param denialUrl URL for the denial action
 * @returns Formatted message string
 */
export async function formatApproverMessage(
  guest: GuestInfo,
  deepLinkUrl: string,
  approvalUrl: string,
  denialUrl: string
): Promise<string> {
  if (!guest || !deepLinkUrl || !approvalUrl || !denialUrl) {
    throw new Error('Guest information and URLs are required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
New guest registration:
Name: ${guest.first_name} ${guest.last_name?.charAt(0)?.toUpperCase() || ''}.
Visit Date: ${formattedDate}
Time: ${guest.gathering_time}
Guests: ${guest.total_guests}
PAM: (${getGuestStatusLabelForApproverNotification(guest.status)})
Guest details at: ${deepLinkUrl}

Please give the final acceptance by clicking approve below

Approve: ${approvalUrl}
`.trim();
}

/**
 * Formats an approver denial notification message
 * Pure function for testability
 * 
 * @param guest Guest information
 * @param deepLinkUrl URL for deep link to a guest detail
 * @returns Formatted message string
 */
export async function formatApproverDenialMessage(
  guest: GuestInfo,
  deepLinkUrl: string
): Promise<string> {
  if (!guest || !deepLinkUrl) {
    throw new Error('Guest information and deep link URL are required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
Guest registration denied:
Name: ${guest.first_name} ${guest.last_name?.charAt(0)?.toUpperCase() || ''}.
Visit Date: ${formattedDate}
Time: ${guest.gathering_time}
Guests: ${guest.total_guests}
PAM: (${getGuestStatusLabelForApproverNotification(guest.status)})

Guest was denied. See guest information at link below.

Guest details at: ${deepLinkUrl}
`.trim();
}

/**
 * Formats an approval notification message
 * Pure function for testability
 * 
 * @param guest Guest information
 * @param passUrl URL for guest pass
 * @returns Formatted message string
 */
export async function formatApprovalMessage(
  guest: GuestInfo,
  passUrl: string
): Promise<string> {
  if (!guest || !passUrl) {
    throw new Error('Guest information and pass URL are required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
Great news! Your guest registration has been approved.

Visit Details:
Date: ${formattedDate}
Time: ${guest.gathering_time}
Guests: ${guest.total_guests}

Your guest pass: ${passUrl}

Please save this link - you'll need it for check-in.
`.trim();
}

/**
 * Formats a denial notification message
 * Pure function for testability
 * 
 * @param guest Guest information
 * @param reason Reason for denial
 * @returns Formatted message string
 */
export async function formatDenialMessage(
  guest: GuestInfo,
  churchContactEmail: string
): Promise<string> {
  if (!guest) {
    throw new Error('Guest information is required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
We regret to inform you that your visit to Formation Church on ${formattedDate} has not been approved.

If you have any questions, please contact us at ${churchContactEmail}.
`.trim();
}


/**
 * Formats a pre-approval notification message
 * Pure function for testability
 * 
 * @param guest Guest information
 * @returns Formatted message string
 */
export async function formatPreApprovalMessage(
  guest: GuestInfo
  
): Promise<string> { 
  if (!guest) {
    throw new Error('Guest information is required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
  Great news! Your visit to 2819 Church has been pre-approved!

  Please wait for final approval. You will receive another message with your guest pass when approved.

  We look forward to seeing you on ${formattedDate} at ${guest.gathering_time}.
  `;
}

/**
 * Returns a user-friendly string for a GuestStatus enum value.
 * @param status - GuestStatus enum value
 * @returns User-friendly status string
 */
import { GuestStatus } from './types';

function getGuestStatusLabelForApproverNotification(status: GuestStatus): string {
  switch (status) {
    case GuestStatus.PENDING_PRE_APPROVAL:
      return 'Pending Pre-Approval';
    case GuestStatus.PENDING:
    case GuestStatus.APPROVED:
      return 'Approved';
    case GuestStatus.PRE_APPROVAL_DENIED:
    case GuestStatus.DENIED:
      return 'Denied';
    default:
      return 'Unknown Status';
  }
}