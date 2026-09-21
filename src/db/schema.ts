import {
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  category: text("category"),
  subject: text("subject"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  category: text("category"),
  program: text("program"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type Registration = typeof registrations.$inferSelect;