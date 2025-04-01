import type { NextRequest } from 'next/server';
import { db, schema } from '../../../../../db';
import { eq, sql } from 'drizzle-orm';
import { successResponse, errorResponse, ErrorCode, notFound } from '../../../../utils/api-response';
import { rateLimit } from '../../../../middleware/rate-limit';
import { requireRole, UserRole } from '../../../../middleware/auth';
import { WebhookEventType, sendWebhook } from '../../../../utils/webhook';

// Apply rate limiting to all service endpoints
const applyRateLimit = rateLimit({ limit: 50, windowInSeconds: 60 });

// GET /api/v1/services - List all services
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request);
    if (rateLimitResponse.status !== 200) {
      return rateLimitResponse;
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
    
    // Get services from database
    const services = await db.query.servicesTable.findMany({
      limit,
      offset,
      orderBy: schema.servicesTable.name,
    });
    
    // Get total count for pagination
    const countResult = await db.select({ 
      count: sql`count(*)` 
    }).from(schema.servicesTable);
    const total = Number(countResult[0].count);
    
    // Return services with pagination metadata
    return successResponse(services, {
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + services.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return errorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch services'
    );
  }
}

// POST /api/v1/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request);
    if (rateLimitResponse.status !== 200) {
      return rateLimitResponse;
    }
    
    // Check if user is admin
    const authResponse = await requireRole(UserRole.ADMIN)(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.price) {
      return errorResponse(
        ErrorCode.BAD_REQUEST,
        'Name and price are required'
      );
    }
    
    // Create service in database
    const [service] = await db.insert(schema.servicesTable)
      .values({
        name: body.name,
        description: body.description,
        price: body.price,
        duration: body.duration,
      })
      .returning();
    
    // Send webhook notification
    try {
      // In a real app, you would fetch webhook configs from the database
      // and send to all subscribed webhooks
      const webhookConfig = {
        url: process.env.WEBHOOK_URL || 'https://example.com/webhook',
        secret: process.env.WEBHOOK_SECRET || 'webhook-secret',
        events: [WebhookEventType.SERVICE_CREATED],
        active: process.env.WEBHOOKS_ENABLED === 'true',
      };
      
      if (webhookConfig.active) {
        await sendWebhook(
          webhookConfig,
          WebhookEventType.SERVICE_CREATED,
          service
        );
      }
    } catch (webhookError) {
      // Log webhook error but don't fail the request
      console.error('Webhook error:', webhookError);
    }
    
    // Return created service
    return successResponse(service, undefined, 201);
  } catch (error) {
    console.error('Error creating service:', error);
    return errorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to create service'
    );
  }
}

// GET /api/v1/services/:id - Get a service by ID
export async function GET_BY_ID(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request);
    if (rateLimitResponse.status !== 200) {
      return rateLimitResponse;
    }
    
    const id = Number.parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return errorResponse(
        ErrorCode.BAD_REQUEST,
        'Invalid service ID'
      );
    }
    
    // Get service from database
    const service = await db.query.servicesTable.findFirst({
      where: eq(schema.servicesTable.id, id),
    });
    
    if (!service) {
      return notFound('Service');
    }
    
    // Return service
    return successResponse(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return errorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch service'
    );
  }
}

// PUT /api/v1/services/:id - Update a service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request);
    if (rateLimitResponse.status !== 200) {
      return rateLimitResponse;
    }
    
    // Check if user is admin
    const authResponse = await requireRole(UserRole.ADMIN)(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }
    
    const id = Number.parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return errorResponse(
        ErrorCode.BAD_REQUEST,
        'Invalid service ID'
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Check if service exists
    const existingService = await db.query.servicesTable.findFirst({
      where: eq(schema.servicesTable.id, id),
    });
    
    if (!existingService) {
      return notFound('Service');
    }
    
    // Update service in database
    const [updatedService] = await db.update(schema.servicesTable)
      .set({
        name: body.name ?? existingService.name,
        description: body.description ?? existingService.description,
        price: body.price ?? existingService.price,
        duration: body.duration ?? existingService.duration,
      })
      .where(eq(schema.servicesTable.id, id))
      .returning();
    
    // Send webhook notification
    try {
      // In a real app, you would fetch webhook configs from the database
      const webhookConfig = {
        url: process.env.WEBHOOK_URL || 'https://example.com/webhook',
        secret: process.env.WEBHOOK_SECRET || 'webhook-secret',
        events: [WebhookEventType.SERVICE_UPDATED],
        active: process.env.WEBHOOKS_ENABLED === 'true',
      };
      
      if (webhookConfig.active) {
        await sendWebhook(
          webhookConfig,
          WebhookEventType.SERVICE_UPDATED,
          updatedService
        );
      }
    } catch (webhookError) {
      // Log webhook error but don't fail the request
      console.error('Webhook error:', webhookError);
    }
    
    // Return updated service
    return successResponse(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    return errorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to update service'
    );
  }
}

// DELETE /api/v1/services/:id - Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request);
    if (rateLimitResponse.status !== 200) {
      return rateLimitResponse;
    }
    
    // Check if user is admin
    const authResponse = await requireRole(UserRole.ADMIN)(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }
    
    const id = Number.parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return errorResponse(
        ErrorCode.BAD_REQUEST,
        'Invalid service ID'
      );
    }
    
    // Check if service exists
    const existingService = await db.query.servicesTable.findFirst({
      where: eq(schema.servicesTable.id, id),
    });
    
    if (!existingService) {
      return notFound('Service');
    }
    
    // Delete service from database
    await db.delete(schema.servicesTable)
      .where(eq(schema.servicesTable.id, id));
    
    // Send webhook notification
    try {
      // In a real app, you would fetch webhook configs from the database
      const webhookConfig = {
        url: process.env.WEBHOOK_URL || 'https://example.com/webhook',
        secret: process.env.WEBHOOK_SECRET || 'webhook-secret',
        events: [WebhookEventType.SERVICE_DELETED],
        active: process.env.WEBHOOKS_ENABLED === 'true',
      };
      
      if (webhookConfig.active) {
        await sendWebhook(
          webhookConfig,
          WebhookEventType.SERVICE_DELETED,
          existingService
        );
      }
    } catch (webhookError) {
      // Log webhook error but don't fail the request
      console.error('Webhook error:', webhookError);
    }
    
    // Return success
    return successResponse({ success: true }, undefined, 204);
  } catch (error) {
    console.error('Error deleting service:', error);
    return errorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to delete service'
    );
  }
}
