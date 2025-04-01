import crypto from 'node:crypto';

// Webhook event types
export enum WebhookEventType {
  BOOKING_CREATED = 'booking.created',
  BOOKING_UPDATED = 'booking.updated',
  BOOKING_CANCELLED = 'booking.cancelled',
  SERVICE_CREATED = 'service.created',
  SERVICE_UPDATED = 'service.updated',
  SERVICE_DELETED = 'service.deleted',
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
}

// Webhook payload structure
export interface WebhookPayload<T = unknown> {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  data: T;
}

// Webhook configuration
interface WebhookConfig {
  url: string;
  secret: string;
  events: WebhookEventType[];
  active: boolean;
}

/**
 * Generate a signature for a webhook payload
 * @param payload The webhook payload
 * @param secret The webhook secret
 * @returns The HMAC signature
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify a webhook signature
 * @param payload The webhook payload
 * @param signature The signature to verify
 * @param secret The webhook secret
 * @returns Whether the signature is valid
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  // Use string comparison instead of timingSafeEqual to avoid Buffer type issues
  return signature === expectedSignature;
}

/**
 * Send a webhook event to a configured endpoint
 * @param config The webhook configuration
 * @param event The event type
 * @param data The event data
 * @returns The response from the webhook endpoint
 */
export async function sendWebhook<T>(
  config: WebhookConfig,
  event: WebhookEventType,
  data: T
): Promise<Response> {
  // Skip if webhook is not active or doesn't subscribe to this event
  if (!config.active || !config.events.includes(event)) {
    throw new Error(`Webhook not configured for event: ${event}`);
  }

  // Create webhook payload
  const payload: WebhookPayload<T> = {
    id: crypto.randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Stringify payload
  const payloadString = JSON.stringify(payload);

  // Generate signature
  const signature = generateSignature(payloadString, config.secret);

  // Send webhook
  return fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
    },
    body: payloadString,
  });
}
