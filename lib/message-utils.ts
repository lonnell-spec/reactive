'use server'

import { formatDateString } from './date-utils';

interface GuestInfo {
  first_name: string;
  last_name: string;
  visit_date: string;
  gathering_time: string;
  total_guests: number;
  status: GuestStatus;
}

interface ChildInfo {
  name: string;
  dob?: string | null;
}

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

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

export async function formatAdminApprovalMessage(
  guest: any,
  deepLinkUrl: string,
  options?: { children?: ChildInfo[]; photoUrl?: string; }
): Promise<string> {
  if (!guest || !deepLinkUrl) {
    throw new Error('Guest information and deep link URL are required');
  }
  const formattedDate = await formatDateString(guest.visit_date);
  const vehicleParts = [guest.vehicle_color, guest.vehicle_make, guest.vehicle_model].filter(Boolean);
  const vehicleLine = vehicleParts.length > 0
    ? `${guest.vehicle_type ? guest.vehicle_type + ' — ' : ''}${vehicleParts.join(' ')}`
    : guest.vehicle_type || 'Not provided';
  const hasKids = guest.should_enroll_children === true;
  let kidsSection = `Formation Kids: ${hasKids ? 'Yes' : 'No'}`;
  if (hasKids && options?.children && options.children.length > 0) {
    const childLines = options.children.map((child, i) => {
      const age = child.dob ? calculateAge(child.dob) : null;
      const ageStr = age !== null ? `, Age ${age}` : '';
      return `  -> Child ${i + 1}: ${child.name}${ageStr}`;
    });
    kidsSection += '\n' + childLines.join('\n');
  }
  const photoLine = options?.photoUrl ? `\nGuest photo: ${options.photoUrl}` : '';
  return `
APPROVED - Friends of the House
Name: ${guest.first_name} ${guest.last_name}
Visit: ${formattedDate} @ ${guest.gathering_time}
Party of: ${guest.total_guests}
Phone: ${guest.phone || 'Not provided'}
Vehicle: ${vehicleLine}
${kidsSection}${photoLine}

View full record: ${deepLinkUrl}
`.trim();
}

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

export async function formatApprovalMessage(
  guest: any,
  passUrl: string
): Promise<string> {
  if (!guest || !passUrl) {
    throw new Error('Guest information and pass URL are required');
  }
  const formattedDate = await formatDateString(guest.visit_date);
  return `
Your registration has been approved.
You are a Friend of the House.

Visit Details:
Date: ${formattedDate}
Time: ${guest.gathering_time}
Party of: ${guest.total_guests}

Arrival Instructions:
- Arrive 25 minutes before The Gathering
- At the security gate, turn on your flashers
- Tell the host: "I am a Friend of the House"
- You will park in X Lot

Your pass: ${passUrl}

Your Hospitality Host will text you Sunday morning with any additional details. See you soon.
`.trim();
}

/**
 * Formats the Sunday morning hospitality host digest.
 * Pass { includePhone: true } to include guest phone numbers (Demetria's version).
 * Gathering times are sorted chronologically (8 AM → 10:30 AM → 1 PM).
 */
export async function formatHospitalityHostDigest(
  guests: any[],
  sundayDate: string,
  options?: { includePhone?: boolean }
): Promise<string> {
  if (!guests || guests.length === 0) {
    return `2819 Friends of the House — ${sundayDate}\n\nNo guests registered for today.`;
  }

  const formattedDate = await formatDateString(sundayDate);
  const includePhone = options?.includePhone === true;

  const byTime: Record<string, any[]> = {};
  for (const guest of guests) {
    const time = guest.gathering_time || 'Unspecified';
    if (!byTime[time]) byTime[time] = [];
    byTime[time].push(guest);
  }

  // Sort gathering times chronologically (not alphabetically)
  function parseTimeToMinutes(t: string): number {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === 'PM';
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h * 60 + m;
  }
  const sortedTimes = Object.keys(byTime).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));

  let lines: string[] = [`2819 Friends of the House — ${formattedDate}`, ''];

  let counter = 1;
  for (const time of sortedTimes) {
    lines.push(`${time}`);
    for (const guest of byTime[time]) {
      const vehicleParts = [guest.vehicle_color, guest.vehicle_make, guest.vehicle_model].filter(Boolean);
      const vehicle = vehicleParts.length > 0
        ? `${guest.vehicle_type ? guest.vehicle_type + ' — ' : ''}${vehicleParts.join(' ')}`
        : guest.vehicle_type || 'Vehicle not provided';

      const hasKids = guest.should_enroll_children === true;
      const kidCount = guest.child_count || 0;
      const kidsLine = hasKids
        ? `Formation Kids: Yes (${kidCount} child${kidCount !== 1 ? 'ren' : ''})`
        : `Formation Kids: No`;

      const photoLine = guest.photo_url ? `Photo: ${guest.photo_url}` : null;
      const phoneLine = includePhone && guest.phone ? `Phone: ${guest.phone}` : null;

      lines.push(`${counter}. ${guest.first_name} ${guest.last_name} | Party of ${guest.total_guests} | ${vehicle}`);
      if (phoneLine) lines.push(`   ${phoneLine}`);
      lines.push(`   ${kidsLine}`);
      if (photoLine) lines.push(`   ${photoLine}`);
      counter++;
    }
    lines.push('');
  }

  lines.push(`Total: ${guests.length} guest${guests.length !== 1 ? 's' : ''}`);
  return lines.join('\n').trim();
}

import { GuestStatus } from './types';
