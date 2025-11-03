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
}

/**
 * Formats a pre-approver notification message
 * Pure function for testability
 * 
 * @param guest Guest information
 * @param adminUrl URL for admin approval
 * @returns Formatted message string
 */
export async function formatPreApproverMessage(
  guest: GuestInfo,
  adminUrl: string
): Promise<string> {
  if (!guest || !adminUrl) {
    throw new Error('Guest information and admin URL are required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
New guest registration requires pre-approval:
Name: ${guest.first_name} ${guest.last_name}
Visit Date: ${formattedDate}
Time: ${guest.gathering_time}
Guests: ${guest.total_guests}
Approve at: ${adminUrl}/admin
If text message, reply "YES" to approve, "NO" to deny.
`.trim();
}

/**
 * Formats an approver notification message
 * Pure function for testability
 * 
 * @param guest Guest information
 * @param adminUrl URL for admin approval
 * @returns Formatted message string
 */
export async function formatApproverMessage(
  guest: GuestInfo,
  adminUrl: string
): Promise<string> {
  if (!guest || !adminUrl) {
    throw new Error('Guest information and admin URL are required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
New guest registration requires approval:
Name: ${guest.first_name} ${guest.last_name}
Visit Date: ${formattedDate}
Time: ${guest.gathering_time}
Guests: ${guest.total_guests}
Approve at: ${adminUrl}/admin
`.trim();
}

/**
 * Formats an approval notification message
 * Pure function for testability
 * 
 * @param guest Guest information
 * @param credentialsUrl URL for guest credentials
 * @returns Formatted message string
 */
export async function formatApprovalMessage(
  guest: GuestInfo,
  credentialsUrl: string
): Promise<string> {
  if (!guest || !credentialsUrl) {
    throw new Error('Guest information and credentials URL are required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
Great news! Your guest registration has been approved.

Visit Details:
Date: ${formattedDate}
Time: ${guest.gathering_time}
Guests: ${guest.total_guests}

Your credentials: ${credentialsUrl}

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
  reason: string
): Promise<string> {
  if (!guest) {
    throw new Error('Guest information is required');
  }

  const formattedDate = await formatDateString(guest.visit_date);

  return `
We're sorry, but your guest registration for ${formattedDate} has been declined.

${reason ? `Reason: ${reason}` : ''}

Please contact us if you have any questions.
`.trim();
}
