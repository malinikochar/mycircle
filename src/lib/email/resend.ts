/**
 * MyCircle — Resend.com Transactional Email Service & Branded Templates (@ensure.in)
 * Uses POST https://api.resend.com/emails with Bearer authentication and Idempotency-Key support.
 */

export interface ResendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  idempotencyKey?: string;
}

export interface ResendSendResult {
  sent: boolean;
  id?: string;
  fromUsed?: string;
  recipients: string[];
  error?: string;
}

const DEFAULT_FROM_EMAIL = 'MyCircle <noreply@ensure.in>';
const FALLBACK_RESEND_ONBOARDING_FROM = 'MyCircle <onboarding@resend.dev>';

function renderMyCircleEmailLayout(options: {
  badgeText: string;
  badgeColor: string;
  heading: string;
  greeting: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const ctaHtml =
    options.ctaLabel && options.ctaUrl
      ? `<div style="margin: 24px 0;">
          <a href="${options.ctaUrl.startsWith('http') ? options.ctaUrl : `${appUrl}${options.ctaUrl}`}"
             style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 22px; border-radius: 8px;">
            ${options.ctaLabel}
          </a>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${options.heading}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0A0A0A;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E8E8EC; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(10,10,10,0.04);">
    <!-- Brand Top Bar -->
    <div style="padding: 20px 28px; border-bottom: 1px solid #E8E8EC; display: flex; align-items: center; justify-content: space-between; background-color: #FFFFFF;">
      <div style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #0A0A0A;">
        <span style="color: #6366F1;">●</span> MyCircle <span style="font-size: 12px; font-weight: 500; color: #6B6B6B; margin-left: 6px;">@ensure.in</span>
      </div>
    </div>

    <!-- Main Content -->
    <div style="padding: 28px;">
      <div style="margin-bottom: 12px;">
        <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; background-color: ${options.badgeColor}18; color: ${options.badgeColor};">
          ${options.badgeText}
        </span>
      </div>

      <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em;">
        ${options.heading}
      </h1>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #0A0A0A; font-weight: 500;">
        ${options.greeting}
      </p>

      <div style="font-size: 14px; line-height: 1.6; color: #3F3F46;">
        ${options.bodyHtml}
      </div>

      ${ctaHtml}
    </div>

    <!-- Footer -->
    <div style="padding: 16px 28px; background-color: #FAFAFA; border-top: 1px solid #E8E8EC; font-size: 12px; color: #6B6B6B; line-height: 1.5;">
      <div>${options.footerNote ?? 'Sent by MyCircle Private Residential Community Network (ensure.in).'}</div>
      <div style="margin-top: 4px; color: #9C9C9C;">Private-by-default residential communications • Serenity Heights</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends a transactional email through the Resend REST API (https://api.resend.com/emails).
 * Uses RESEND_FROM_EMAIL ("MyCircle <noreply@ensure.in>") and automatically retries with
 * "MyCircle <onboarding@resend.dev>" if the custom domain is still pending DNS verification.
 */
export async function sendResendEmail(payload: ResendEmailPayload): Promise<ResendSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

  if (!apiKey) {
    return {
      sent: false,
      recipients,
      error: 'RESEND_API_KEY environment variable is not configured.',
    };
  }

  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;

  async function attemptSend(fromAddress: string) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    if (payload.idempotencyKey) {
      headers['Idempotency-Key'] = payload.idempotencyKey;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: fromAddress,
        to: recipients,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    return { ok: response.ok, status: response.status, body };
  }

  try {
    const primaryAttempt = await attemptSend(configuredFrom);
    if (primaryAttempt.ok && primaryAttempt.body.id) {
      return {
        sent: true,
        id: primaryAttempt.body.id,
        fromUsed: configuredFrom,
        recipients,
      };
    }

    // If custom @ensure.in domain is not yet verified in Resend DNS, fallback cleanly to onboarding@resend.dev
    if (configuredFrom !== FALLBACK_RESEND_ONBOARDING_FROM) {
      const fallbackAttempt = await attemptSend(FALLBACK_RESEND_ONBOARDING_FROM);
      if (fallbackAttempt.ok && fallbackAttempt.body.id) {
        return {
          sent: true,
          id: fallbackAttempt.body.id,
          fromUsed: FALLBACK_RESEND_ONBOARDING_FROM,
          recipients,
        };
      }
    }

    return {
      sent: false,
      recipients,
      error: primaryAttempt.body.message ?? `Resend HTTP ${primaryAttempt.status}`,
    };
  } catch (err) {
    return {
      sent: false,
      recipients,
      error: err instanceof Error ? err.message : 'Resend network error',
    };
  }
}

/* ============================================================================
 * 1. Member Registration Welcome Email Template
 * ============================================================================ */
export function buildRegistrationWelcomeEmail(params: {
  displayName: string;
  username: string;
  email: string;
  unitNumber: string;
  membershipStatus: string;
}): ResendEmailPayload {
  const html = renderMyCircleEmailLayout({
    badgeText: 'Welcome to MyCircle',
    badgeColor: '#10B981',
    heading: 'Your Resident Account is Ready',
    greeting: `Hello ${params.displayName},`,
    bodyHtml: `
      <p>Welcome to <strong>MyCircle</strong>! Your resident profile has been created with private-by-default contact protection.</p>
      <div style="background: #FAFAFA; border: 1px solid #E8E8EC; border-radius: 10px; padding: 14px 16px; margin: 16px 0;">
        <div><strong>Username:</strong> <code>@${params.username}</code></div>
        <div><strong>Registered Email:</strong> ${params.email}</div>
        <div><strong>Apartment / Unit:</strong> Flat ${params.unitNumber}</div>
        <div><strong>Verification Status:</strong> ${params.membershipStatus.toUpperCase()}</div>
      </div>
      <p>You can now sign in to browse the community directory, order from local shops &amp; pharmacy, and share items with neighbours.</p>
    `,
    ctaLabel: 'Open MyCircle Dashboard',
    ctaUrl: '/login',
  });

  return {
    to: params.email,
    subject: `Welcome to MyCircle, ${params.displayName} (@${params.username})`,
    html,
  };
}

/* ============================================================================
 * 2. Forgot Password / Password Recovery Confirmation Email Template
 * ============================================================================ */
export function buildForgotPasswordResetEmail(params: {
  displayName: string;
  username: string;
  email: string;
}): ResendEmailPayload {
  const html = renderMyCircleEmailLayout({
    badgeText: 'Password Reset',
    badgeColor: '#F59E0B',
    heading: 'Your MyCircle Password Was Reset',
    greeting: `Hello ${params.displayName},`,
    bodyHtml: `
      <p>Your password for MyCircle account <strong>@${params.username}</strong> (${params.email}) was successfully reset via the self-service recovery portal.</p>
      <div style="background: #FAFAFA; border: 1px solid #E8E8EC; border-radius: 10px; padding: 14px 16px; margin: 16px 0;">
        <div><strong>Account:</strong> @${params.username}</div>
        <div><strong>Email:</strong> ${params.email}</div>
        <div><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
      </div>
      <p>If you did not perform this password reset, please contact the Primary Society Admin (<code>admin@ensure.in</code>) immediately.</p>
    `,
    ctaLabel: 'Sign In with New Password',
    ctaUrl: '/login',
  });

  return {
    to: params.email,
    subject: `MyCircle Security Alert — Password Reset for @${params.username}`,
    html,
  };
}

/* ============================================================================
 * 3. Logged-In Password Changed Notification Email Template
 * ============================================================================ */
export function buildPasswordChangedEmail(params: {
  displayName: string;
  username: string;
  email: string;
}): ResendEmailPayload {
  const html = renderMyCircleEmailLayout({
    badgeText: 'Security Confirmation',
    badgeColor: '#6366F1',
    heading: 'Your Account Password Has Been Updated',
    greeting: `Hello ${params.displayName},`,
    bodyHtml: `
      <p>This is a confirmation that the password for your MyCircle profile (<strong>@${params.username}</strong>) was updated from your Account Security settings.</p>
      <p>No further action is required if you initiated this change.</p>
    `,
    ctaLabel: 'Manage Account Security',
    ctaUrl: '/account',
  });

  return {
    to: params.email,
    subject: `MyCircle — Password Updated for @${params.username}`,
    html,
  };
}

/* ============================================================================
 * 4. Local Shop / Pharmacy Order Confirmation Email Template
 * ============================================================================ */
export function buildShopOrderPlacedEmail(params: {
  buyerEmail: string;
  buyerName: string;
  orderId: string;
  paymentMethod: string;
  instructions: string;
}): ResendEmailPayload {
  const html = renderMyCircleEmailLayout({
    badgeText: 'Order Placed',
    badgeColor: '#10B981',
    heading: 'Your Neighbourhood Store Order is Confirmed',
    greeting: `Hello ${params.buyerName},`,
    bodyHtml: `
      <p>Your order has been submitted to the neighbourhood store desk on MyCircle.</p>
      <div style="background: #FAFAFA; border: 1px solid #E8E8EC; border-radius: 10px; padding: 14px 16px; margin: 16px 0;">
        <div><strong>Order Reference:</strong> <code>${params.orderId}</code></div>
        <div><strong>Payment Method:</strong> ${params.paymentMethod.replace(/_/g, ' ')}</div>
        <div><strong>Delivery Instructions:</strong> ${params.instructions}</div>
      </div>
      <p>If the merchant proposes any weight or price revision, you will receive a notification to approve or decline before fulfilment.</p>
    `,
    ctaLabel: 'View My Orders & Invoices',
    ctaUrl: '/shops',
  });

  return {
    to: params.buyerEmail,
    subject: `MyCircle Order Confirmation (${params.orderId.slice(0, 8)})`,
    html,
  };
}

/* ============================================================================
 * 5. Order Price Revision Decision Email Template
 * ============================================================================ */
export function buildOrderPriceRevisionEmail(params: {
  recipientEmail: string;
  buyerName: string;
  orderId: string;
  approved: boolean;
}): ResendEmailPayload {
  const statusText = params.approved ? 'Approved by Resident' : 'Declined & Cancelled';
  const html = renderMyCircleEmailLayout({
    badgeText: 'Order Revision Update',
    badgeColor: params.approved ? '#10B981' : '#EF4444',
    heading: `Revised Order Total ${statusText}`,
    greeting: `Hello ${params.buyerName},`,
    bodyHtml: `
      <p>Your response to the merchant price revision for order <code>${params.orderId}</code> has been recorded.</p>
      <div style="background: #FAFAFA; border: 1px solid #E8E8EC; border-radius: 10px; padding: 14px 16px; margin: 16px 0;">
        <div><strong>Decision:</strong> ${statusText}</div>
      </div>
    `,
    ctaLabel: 'View Order Status',
    ctaUrl: '/shops',
  });

  return {
    to: params.recipientEmail,
    subject: `MyCircle Order Revision ${params.approved ? 'Approved' : 'Declined'}`,
    html,
  };
}

/* ============================================================================
 * 6. Social Exchange Listing Published Email Template
 * ============================================================================ */
export function buildExchangeListingPostedEmail(params: {
  ownerEmail: string;
  ownerName: string;
  title: string;
  exchangeMode: string;
  handoverOptions: string;
}): ResendEmailPayload {
  const html = renderMyCircleEmailLayout({
    badgeText: 'Social Exchange',
    badgeColor: '#8B5CF6',
    heading: 'Your Listing is Live in Social Exchange',
    greeting: `Hello ${params.ownerName},`,
    bodyHtml: `
      <p>Your listing has been published to verified neighbours in your apartment community.</p>
      <div style="background: #FAFAFA; border: 1px solid #E8E8EC; border-radius: 10px; padding: 14px 16px; margin: 16px 0;">
        <div><strong>Item / Request:</strong> ${params.title}</div>
        <div><strong>Exchange Mode:</strong> ${params.exchangeMode.replace(/_/g, ' ')}</div>
        <div><strong>Handover Location:</strong> ${params.handoverOptions}</div>
      </div>
    `,
    ctaLabel: 'Manage My Exchange Listings',
    ctaUrl: '/social-service',
  });

  return {
    to: params.ownerEmail,
    subject: `MyCircle Social Exchange — "${params.title}" Published`,
    html,
  };
}

/* ============================================================================
 * 7. Emergency SOS Incident Dispatch Email Template
 * ============================================================================ */
export function buildSOSEmergencyAlertEmail(params: {
  recipientEmails: string[];
  reporterName: string;
  category: string;
  floorLabel: string;
  liftOrAreaLabel: string;
  notes: string;
}): ResendEmailPayload {
  const html = renderMyCircleEmailLayout({
    badgeText: 'URGENT SOS DISPATCH',
    badgeColor: '#EF4444',
    heading: `Emergency SOS Alert: ${params.category.replace(/_/g, ' ').toUpperCase()}`,
    greeting: 'Attention On-Duty Security Responders & Safety Admin,',
    bodyHtml: `
      <p>An emergency SOS alert has been triggered on MyCircle and requires immediate responder attention.</p>
      <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 14px 16px; margin: 16px 0; color: #991B1B;">
        <div><strong>Reported By:</strong> ${params.reporterName}</div>
        <div><strong>Category:</strong> ${params.category.replace(/_/g, ' ').toUpperCase()}</div>
        <div><strong>Floor / Location:</strong> ${params.floorLabel}</div>
        <div><strong>Lift / Area:</strong> ${params.liftOrAreaLabel}</div>
        <div><strong>Notes:</strong> ${params.notes || 'None provided'}</div>
      </div>
    `,
    ctaLabel: 'Open Emergency SOS Console',
    ctaUrl: '/safety',
  });

  return {
    to: params.recipientEmails,
    subject: `[URGENT SOS] ${params.category.replace(/_/g, ' ').toUpperCase()} — ${params.floorLabel}`,
    html,
  };
}
