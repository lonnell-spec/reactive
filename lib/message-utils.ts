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
 * Formats an admin approval notification message (no action links)
 * Pure function for testability
 * 
 * @param guest Guest information
 * @param deepLinkUrl URL for deep link to a guest detail
 * @returns Formatted message string
 */
export async function formatAdminApprovalMessage(
  guest: GuestInfo,
  deepLinkUrl: string
): Promise<string> {
  if (!guest || !deepLinkUrl) {
    throw new Error('Guest information and deep link URL are required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
Guest registration approved:
Name: ${guest.first_name} ${guest.last_name?.charAt(0)?.toUpperCase() || ''}.
Visit Date: ${formattedDate}
Time: ${guest.gathering_time}
Guests: ${guest.total_guests}

Guest has been approved and notified.

View guest details: ${deepLinkUrl}
`.trim();
}

/**
 * Formats an admin denial notification message (no action links)
 * Pure function for testability
 * 
 * @param guest Guest information
 * @param deepLinkUrl URL for deep link to a guest detail
 * @returns Formatted message string
 */
export async function formatAdminDenialMessage(
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

Guest was denied.

View guest details: ${deepLinkUrl}
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

import { GuestStatus } from './types';