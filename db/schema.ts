import { pgTable, serial, varchar, text, timestamp, numeric, integer, jsonb, boolean } from "drizzle-orm/pg-core";

// User accounts
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  hashed_password: text("hashed_password").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Authentication sessions
export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  user_id: serial("user_id").references(() => usersTable.id),
  session_token: text("session_token").unique().notNull(),
  expires_at: timestamp("expires_at").notNull(),
});

// Service catalog
export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration"), // in minutes
});

// Booking records
export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  user_id: serial("user_id").references(() => usersTable.id),
  service_id: serial("service_id").references(() => servicesTable.id),
  scheduled_at: timestamp("scheduled_at").notNull(),
  status: varchar("status", { length: 50 }).default('pending'),
});

// Analytics - Page Views
export const pageViewsTable = pgTable("page_views", {
  id: serial("id").primaryKey(),
  user_id: serial("user_id").references(() => usersTable.id),
  url: text("url").notNull(),
  referrer: text("referrer"),
  user_agent: text("user_agent"),
  ip_address: varchar("ip_address", { length: 45 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Analytics - Service Interactions
export const serviceInteractionsTable = pgTable("service_interactions", {
  id: serial("id").primaryKey(),
  user_id: serial("user_id").references(() => usersTable.id),
  service_id: serial("service_id").references(() => servicesTable.id),
  interaction_type: varchar("interaction_type", { length: 50 }).notNull(), // view, click, quote, book
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Analytics - Conversion Events
export const conversionEventsTable = pgTable("conversion_events", {
  id: serial("id").primaryKey(),
  user_id: serial("user_id").references(() => usersTable.id),
  event_type: varchar("event_type", { length: 50 }).notNull(), // signup, booking, purchase
  booking_id: integer("booking_id").references(() => bookingsTable.id),
  value: numeric("value", { precision: 10, scale: 2 }),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Analytics - User Metrics
export const userMetricsTable = pgTable("user_metrics", {
  id: serial("id").primaryKey(),
  user_id: serial("user_id").references(() => usersTable.id).unique(),
  total_bookings: integer("total_bookings").default(0),
  total_spend: numeric("total_spend", { precision: 10, scale: 2 }).default(0),
  last_activity: timestamp("last_activity"),
  is_active: boolean("is_active").default(true),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
