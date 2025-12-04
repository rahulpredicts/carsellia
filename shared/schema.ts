import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index, jsonb, integer, decimal, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Supports both Replit Auth (OAuth) and admin-created password accounts
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default('dealer'), // 'admin', 'dealer', 'data_analyst', 'transportation', 'scraper', 'supervisor', 'manager'
  assignedSupervisorId: varchar("assigned_supervisor_id"), // For scrapers - which supervisor they report to
  passwordHash: varchar("password_hash"), // For admin-created users (null for OAuth users)
  passwordResetToken: varchar("password_reset_token"), // For password reset functionality
  passwordResetExpiry: timestamp("password_reset_expiry"), // Token expiration
  isActive: varchar("is_active").notNull().default('true'), // Account status
  authType: varchar("auth_type").notNull().default('oauth'), // 'oauth' or 'password'
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Schema for admin creating new users
export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "dealer", "dealer_admin", "dealer_staff", "data_analyst", "transportation", "scraper", "supervisor", "manager"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  assignedSupervisorId: z.string().optional(),
  dealershipId: z.string().optional(), // For dealer_admin/dealer_staff - which dealership they belong to
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Schema for updating user
export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["admin", "dealer", "dealer_admin", "dealer_staff", "data_analyst", "transportation", "scraper", "supervisor", "manager"]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  assignedSupervisorId: z.string().optional(),
  dealershipId: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const dealerships = pgTable("dealerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  province: text("province").notNull(),
  address: text("address").notNull(),
  postalCode: text("postal_code").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cars = pgTable("cars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealershipId: varchar("dealership_id").notNull().references(() => dealerships.id, { onDelete: 'cascade' }),
  vin: text("vin"),
  stockNumber: text("stock_number"),
  condition: text("condition").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim").notNull(),
  year: text("year").notNull(),
  color: text("color").notNull(),
  price: text("price").notNull(),
  kilometers: text("kilometers").notNull(),
  transmission: text("transmission").notNull(),
  fuelType: text("fuel_type").notNull(),
  bodyType: text("body_type").notNull(),
  drivetrain: text("drivetrain"),
  engineCylinders: text("engine_cylinders"),
  engineDisplacement: text("engine_displacement"),
  features: text("features").array(),
  listingLink: text("listing_link").notNull(),
  carfaxLink: text("carfax_link").notNull(),
  carfaxStatus: text("carfax_status"),
  notes: text("notes").notNull(),
  status: text("status").notNull().default('available'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_cars_dealership_status").on(table.dealershipId, table.status),
  index("IDX_cars_make_model").on(table.make, table.model),
  index("IDX_cars_year").on(table.year),
  index("IDX_cars_price").on(table.price),
  index("IDX_cars_kilometers").on(table.kilometers),
  index("IDX_cars_created_at").on(table.createdAt),
  index("IDX_cars_status").on(table.status),
]);

// Dealership schemas
export const insertDealershipSchema = createInsertSchema(dealerships).omit({
  id: true,
  createdAt: true,
});

export const updateDealershipSchema = insertDealershipSchema.partial();

export type InsertDealership = z.infer<typeof insertDealershipSchema>;
export type UpdateDealership = z.infer<typeof updateDealershipSchema>;
export type Dealership = typeof dealerships.$inferSelect;

// Car schemas
export const insertCarSchema = createInsertSchema(cars).omit({
  id: true,
  createdAt: true,
});

export const updateCarSchema = insertCarSchema.partial();

export type InsertCar = z.infer<typeof insertCarSchema>;
export type UpdateCar = z.infer<typeof updateCarSchema>;
export type Car = typeof cars.$inferSelect;

// ============================================
// TRANSPORTATION MODULE TABLES
// ============================================

// Transport Trucks (Fleet)
export const trucks = pgTable("trucks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitNumber: varchar("unit_number").unique().notNull(),
  make: varchar("make"),
  model: varchar("model"),
  year: integer("year"),
  capacity: integer("capacity").default(8),
  currentLocation: varchar("current_location"),
  status: varchar("status").default("available"), // available, en_route, maintenance
  createdAt: timestamp("created_at").defaultNow(),
});

export type Truck = typeof trucks.$inferSelect;
export type InsertTruck = typeof trucks.$inferInsert;

// Transport Drivers
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  licenseNumber: varchar("license_number"),
  licenseExpiry: date("license_expiry"),
  assignedTruckId: varchar("assigned_truck_id").references(() => trucks.id),
  status: varchar("status").default("active"), // active, off_duty, on_leave
  photoUrl: varchar("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;

// Transport Quotes
export const transportQuotes = pgTable("transport_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteNumber: varchar("quote_number").unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  pickupAddress: text("pickup_address"),
  pickupCity: varchar("pickup_city").notNull(),
  pickupProvince: varchar("pickup_province").notNull(),
  pickupPostal: varchar("pickup_postal"),
  deliveryAddress: text("delivery_address"),
  deliveryCity: varchar("delivery_city").notNull(),
  deliveryProvince: varchar("delivery_province").notNull(),
  deliveryPostal: varchar("delivery_postal"),
  distanceKm: decimal("distance_km", { precision: 10, scale: 2 }),
  vehicleYear: integer("vehicle_year"),
  vehicleMake: varchar("vehicle_make"),
  vehicleModel: varchar("vehicle_model"),
  vehicleType: varchar("vehicle_type"), // sedan, suv, pickup, fullsize_suv, luxury, motorcycle
  vehicleVin: varchar("vehicle_vin"),
  isRunning: boolean("is_running").default(true),
  isEnclosed: boolean("is_enclosed").default(false),
  liftGateRequired: boolean("lift_gate_required").default(false),
  vehicleCount: integer("vehicle_count").default(1),
  serviceLevel: varchar("service_level").default("standard"), // standard, expedited_2day, expedited_1day
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  surcharges: decimal("surcharges", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  status: varchar("status").default("quoted"), // quoted, expired, converted
  validUntil: timestamp("valid_until"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type TransportQuote = typeof transportQuotes.$inferSelect;
export type InsertTransportQuote = typeof transportQuotes.$inferInsert;

export const insertTransportQuoteSchema = createInsertSchema(transportQuotes).omit({
  id: true,
  createdAt: true,
});

// Transport Orders
export const transportOrders = pgTable("transport_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").unique().notNull(),
  quoteId: varchar("quote_id").references(() => transportQuotes.id),
  pickupContactName: varchar("pickup_contact_name"),
  pickupContactPhone: varchar("pickup_contact_phone"),
  pickupContactEmail: varchar("pickup_contact_email"),
  pickupAddress: varchar("pickup_address"),
  pickupCity: varchar("pickup_city"),
  pickupProvince: varchar("pickup_province"),
  pickupPostalCode: varchar("pickup_postal_code"),
  pickupInstructions: text("pickup_instructions"),
  pickupDate: date("pickup_date"),
  pickupTimePreference: varchar("pickup_time_preference"), // morning, afternoon, evening
  deliveryContactName: varchar("delivery_contact_name"),
  deliveryContactPhone: varchar("delivery_contact_phone"),
  deliveryContactEmail: varchar("delivery_contact_email"),
  deliveryAddress: varchar("delivery_address"),
  deliveryCity: varchar("delivery_city"),
  deliveryProvince: varchar("delivery_province"),
  deliveryPostalCode: varchar("delivery_postal_code"),
  deliveryInstructions: text("delivery_instructions"),
  estimatedDeliveryDate: date("estimated_delivery_date"),
  actualPickupDatetime: timestamp("actual_pickup_datetime"),
  actualDeliveryDatetime: timestamp("actual_delivery_datetime"),
  driverId: varchar("driver_id").references(() => drivers.id),
  truckId: varchar("truck_id").references(() => trucks.id),
  status: varchar("status").default("booked"), // booked, assigned, en_route_pickup, picked_up, in_transit, en_route_delivery, delivered, completed, cancelled
  trackingUrl: varchar("tracking_url"),
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, refunded
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type TransportOrder = typeof transportOrders.$inferSelect;
export type InsertTransportOrder = typeof transportOrders.$inferInsert;

export const insertTransportOrderSchema = createInsertSchema(transportOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tracking Events
export const trackingEvents = pgTable("tracking_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => transportOrders.id).notNull(),
  eventType: varchar("event_type").notNull(), // pickup_scheduled, driver_assigned, en_route, picked_up, checkpoint, delivered
  location: varchar("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type InsertTrackingEvent = typeof trackingEvents.$inferInsert;

// Order Status History - Audit trail for all status changes
export const orderStatusHistory = pgTable("order_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => transportOrders.id, { onDelete: 'cascade' }).notNull(),
  previousStatus: varchar("previous_status"),
  newStatus: varchar("new_status").notNull(),
  changedByUserId: varchar("changed_by_user_id").references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_order_status_history_order").on(table.orderId),
  index("IDX_order_status_history_created").on(table.createdAt),
]);

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type InsertOrderStatusHistory = typeof orderStatusHistory.$inferInsert;

export const insertOrderStatusHistorySchema = createInsertSchema(orderStatusHistory).omit({
  id: true,
  createdAt: true,
});

// Order Documents - Uploaded documents for transport orders
export const orderDocuments = pgTable("order_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => transportOrders.id, { onDelete: 'cascade' }).notNull(),
  category: varchar("category").notNull(), // release_letter, vehicle_photos, ownership, lien_release, power_of_attorney, insurance, bol, invoice, work_card, other
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  fileUrl: text("file_url").notNull(),
  customLabel: varchar("custom_label"), // For "other" category
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  uploadedByUserId: varchar("uploaded_by_user_id").references(() => users.id),
  reviewedByUserId: varchar("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  isGenerated: boolean("is_generated").notNull().default(false), // True for BOL, Invoice, Work Card
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_order_documents_order").on(table.orderId),
  index("IDX_order_documents_category").on(table.category),
  index("IDX_order_documents_status").on(table.status),
]);

export type OrderDocument = typeof orderDocuments.$inferSelect;
export type InsertOrderDocument = typeof orderDocuments.$inferInsert;

export const insertOrderDocumentSchema = createInsertSchema(orderDocuments).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export type InsertOrderDocumentInput = z.infer<typeof insertOrderDocumentSchema>;

// Document category enum for validation
export const documentCategoryEnum = z.enum([
  "release_letter",
  "vehicle_photos", 
  "ownership",
  "lien_release",
  "power_of_attorney",
  "insurance",
  "bol",
  "invoice",
  "work_card",
  "other"
]);

export type DocumentCategory = z.infer<typeof documentCategoryEnum>;

// Transport Notifications - Notifications for transport orders
export const transportNotifications = pgTable("transport_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => transportOrders.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(), // Recipient
  type: varchar("type").notNull(), // transport_ordered, driver_assigned, vehicle_picked_up, in_transit, delivered, documents_ready
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_transport_notifications_order").on(table.orderId),
  index("IDX_transport_notifications_user").on(table.userId),
  index("IDX_transport_notifications_read").on(table.isRead),
  index("IDX_transport_notifications_created").on(table.createdAt),
]);

export type TransportNotification = typeof transportNotifications.$inferSelect;
export type InsertTransportNotification = typeof transportNotifications.$inferInsert;

export const insertTransportNotificationSchema = createInsertSchema(transportNotifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export type InsertTransportNotificationInput = z.infer<typeof insertTransportNotificationSchema>;

// Notification type enum for validation
export const transportNotificationTypeEnum = z.enum([
  "transport_ordered",
  "driver_assigned",
  "vehicle_picked_up",
  "in_transit",
  "delivered",
  "documents_ready"
]);

export type TransportNotificationType = z.infer<typeof transportNotificationTypeEnum>;

// Order status enum for validation
export const orderStatusEnum = z.enum([
  "booked",
  "assigned",
  "en_route_pickup",
  "picked_up",
  "in_transit",
  "en_route_delivery",
  "delivered",
  "completed",
  "cancelled"
]);

export type OrderStatus = z.infer<typeof orderStatusEnum>;

// ============================================
// DATA ANALYST MODULE TABLES
// ============================================

// Data Submissions - Car data scraped/entered by scrapers
export const dataSubmissions = pgTable("data_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scraperId: varchar("scraper_id").references(() => users.id).notNull(),
  sourceUrl: text("source_url"),
  carMake: varchar("car_make").notNull(),
  carModel: varchar("car_model").notNull(),
  year: integer("year").notNull(),
  trim: varchar("trim"),
  kilometers: integer("kilometers").notNull(),
  price: integer("price").notNull(),
  location: varchar("location"),
  province: varchar("province"),
  color: varchar("color"),
  transmission: varchar("transmission"),
  fuelType: varchar("fuel_type"),
  bodyType: varchar("body_type"),
  drivetrain: varchar("drivetrain"),
  vin: varchar("vin"),
  images: text("images").array(),
  notes: text("notes"),
  status: varchar("status").notNull().default("pending_supervisor"), // pending_supervisor, pending_manager, approved, rejected, uploaded
  flaggedFields: text("flagged_fields").array(), // ['price', 'kilometers', 'trim'] etc
  flagReason: text("flag_reason"),
  autoFlags: jsonb("auto_flags"), // {price: 'outside_range', km: 'too_high', etc}
  supervisorId: varchar("supervisor_id").references(() => users.id),
  supervisorApprovedAt: timestamp("supervisor_approved_at"),
  managerId: varchar("manager_id").references(() => users.id),
  managerApprovedAt: timestamp("manager_approved_at"),
  uploadedAt: timestamp("uploaded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_submissions_scraper").on(table.scraperId),
  index("IDX_submissions_status").on(table.status),
  index("IDX_submissions_supervisor").on(table.supervisorId),
  index("IDX_submissions_created").on(table.createdAt),
]);

export type DataSubmission = typeof dataSubmissions.$inferSelect;
export type InsertDataSubmission = typeof dataSubmissions.$inferInsert;

export const insertDataSubmissionSchema = createInsertSchema(dataSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  supervisorApprovedAt: true,
  managerApprovedAt: true,
  uploadedAt: true,
});

export type InsertDataSubmissionInput = z.infer<typeof insertDataSubmissionSchema>;

// Review Logs - Audit trail for all review actions
export const reviewLogs = pgTable("review_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").references(() => dataSubmissions.id).notNull(),
  reviewerId: varchar("reviewer_id").references(() => users.id).notNull(),
  reviewerRole: varchar("reviewer_role").notNull(), // supervisor, manager
  action: varchar("action").notNull(), // approve, reject, send_back, upload
  previousStatus: varchar("previous_status"),
  newStatus: varchar("new_status"),
  comments: text("comments"),
  flaggedFields: text("flagged_fields").array(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_review_logs_submission").on(table.submissionId),
  index("IDX_review_logs_reviewer").on(table.reviewerId),
  index("IDX_review_logs_created").on(table.createdAt),
]);

export type ReviewLog = typeof reviewLogs.$inferSelect;
export type InsertReviewLog = typeof reviewLogs.$inferInsert;

export const insertReviewLogSchema = createInsertSchema(reviewLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertReviewLogInput = z.infer<typeof insertReviewLogSchema>;

// ============================================
// DEALER PORTAL (B2B) MODULE TABLES
// ============================================

// User-Dealership Association - Links dealer_admin/dealer_staff to their dealership
export const userDealerships = pgTable("user_dealerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  dealershipId: varchar("dealership_id").references(() => dealerships.id, { onDelete: 'cascade' }).notNull(),
  role: varchar("role").notNull().default("dealer_staff"), // dealer_admin, dealer_staff
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_user_dealerships_user").on(table.userId),
  index("IDX_user_dealerships_dealership").on(table.dealershipId),
]);

export type UserDealership = typeof userDealerships.$inferSelect;
export type InsertUserDealership = typeof userDealerships.$inferInsert;

// Dealer Inventory - Private vehicle inventory for each dealership (separate from main scraped cars)
export const dealerInventory = pgTable("dealer_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealershipId: varchar("dealership_id").references(() => dealerships.id, { onDelete: 'cascade' }).notNull(),
  addedByUserId: varchar("added_by_user_id").references(() => users.id),
  vin: varchar("vin"),
  stockNumber: varchar("stock_number"),
  make: varchar("make").notNull(),
  model: varchar("model").notNull(),
  year: integer("year").notNull(),
  trim: varchar("trim"),
  color: varchar("color"),
  kilometers: integer("kilometers").notNull(),
  condition: varchar("condition").notNull(), // excellent, good, fair, poor
  transmission: varchar("transmission"),
  fuelType: varchar("fuel_type"),
  bodyType: varchar("body_type"),
  drivetrain: varchar("drivetrain"),
  photos: text("photos").array(),
  notes: text("notes"),
  askingPrice: decimal("asking_price", { precision: 12, scale: 2 }), // Their selling price (HIDDEN from other dealers)
  buyBudgetSimilar: decimal("buy_budget_similar", { precision: 12, scale: 2 }), // What they'd pay for similar cars
  listOnMarketplace: boolean("list_on_marketplace").notNull().default(false),
  status: varchar("status").notNull().default("available"), // available, sold, unlisted, pending
  soldAt: timestamp("sold_at"),
  soldPrice: decimal("sold_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_dealer_inventory_dealership").on(table.dealershipId),
  index("IDX_dealer_inventory_make_model").on(table.make, table.model),
  index("IDX_dealer_inventory_year").on(table.year),
  index("IDX_dealer_inventory_status").on(table.status),
  index("IDX_dealer_inventory_marketplace").on(table.listOnMarketplace),
]);

export type DealerInventory = typeof dealerInventory.$inferSelect;
export type InsertDealerInventory = typeof dealerInventory.$inferInsert;

export const insertDealerInventorySchema = createInsertSchema(dealerInventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  soldAt: true,
});

export type InsertDealerInventoryInput = z.infer<typeof insertDealerInventorySchema>;

// Appraisal History - Historical record of all appraisals done by a dealership
export const appraisalHistory = pgTable("appraisal_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealershipId: varchar("dealership_id").references(() => dealerships.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(), // Who performed the appraisal
  inventoryItemId: varchar("inventory_item_id").references(() => dealerInventory.id), // Optional link to inventory
  vin: varchar("vin"),
  make: varchar("make").notNull(),
  model: varchar("model").notNull(),
  year: integer("year").notNull(),
  trim: varchar("trim"),
  kilometers: integer("kilometers").notNull(),
  condition: varchar("condition").notNull(),
  conditionGrade: varchar("condition_grade"), // Carsellia Grade (A+, A, B+, B, etc.)
  photos: text("photos").array(),
  appraisedValue: decimal("appraised_value", { precision: 12, scale: 2 }),
  sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }).notNull(),
  buyBudget: decimal("buy_budget", { precision: 12, scale: 2 }).notNull(),
  reconCost: decimal("recon_cost", { precision: 12, scale: 2 }),
  desiredProfit: decimal("desired_profit", { precision: 12, scale: 2 }),
  listedOnMarketplace: boolean("listed_on_marketplace").notNull().default(false),
  adjustments: jsonb("adjustments"), // Detailed pricing adjustments applied
  comparablesUsed: integer("comparables_used"),
  recommendedPriceMin: decimal("recommended_price_min", { precision: 12, scale: 2 }),
  recommendedPriceMax: decimal("recommended_price_max", { precision: 12, scale: 2 }),
  decision: varchar("decision"), // BUY, WHOLESALE, REJECT
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_appraisal_history_dealership").on(table.dealershipId),
  index("IDX_appraisal_history_user").on(table.userId),
  index("IDX_appraisal_history_make_model").on(table.make, table.model),
  index("IDX_appraisal_history_created").on(table.createdAt),
]);

export type AppraisalHistory = typeof appraisalHistory.$inferSelect;
export type InsertAppraisalHistory = typeof appraisalHistory.$inferInsert;

export const insertAppraisalHistorySchema = createInsertSchema(appraisalHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertAppraisalHistoryInput = z.infer<typeof insertAppraisalHistorySchema>;

// Interest Requests - When a dealer expresses interest in a car (goes to Platform Admin)
export const interestRequests = pgTable("interest_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestingDealershipId: varchar("requesting_dealership_id").references(() => dealerships.id).notNull(),
  requestingUserId: varchar("requesting_user_id").references(() => users.id).notNull(),
  targetType: varchar("target_type").notNull(), // 'dealer_listing', 'main_inventory'
  targetDealerInventoryId: varchar("target_dealer_inventory_id").references(() => dealerInventory.id),
  targetCarId: varchar("target_car_id").references(() => cars.id),
  offeredPrice: decimal("offered_price", { precision: 12, scale: 2 }), // What buyer is willing to pay (optional)
  message: text("message"),
  status: varchar("status").notNull().default("pending"), // pending, admin_reviewing, admin_contacted, completed, declined
  adminNotes: text("admin_notes"),
  adminUserId: varchar("admin_user_id").references(() => users.id),
  adminContactedAt: timestamp("admin_contacted_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_interest_requests_requesting").on(table.requestingDealershipId),
  index("IDX_interest_requests_status").on(table.status),
  index("IDX_interest_requests_created").on(table.createdAt),
]);

export type InterestRequest = typeof interestRequests.$inferSelect;
export type InsertInterestRequest = typeof interestRequests.$inferInsert;

export const insertInterestRequestSchema = createInsertSchema(interestRequests).omit({
  id: true,
  createdAt: true,
  adminContactedAt: true,
  resolvedAt: true,
});

export type InsertInterestRequestInput = z.infer<typeof insertInterestRequestSchema>;

// Smart Matches - System-generated matches between buyers and sellers
export const dealerMatches = pgTable("dealer_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerDealershipId: varchar("buyer_dealership_id").references(() => dealerships.id).notNull(),
  buyerAppraisalId: varchar("buyer_appraisal_id").references(() => appraisalHistory.id), // The appraisal with buy budget
  sellerDealershipId: varchar("seller_dealership_id").references(() => dealerships.id), // Null if main inventory
  sellerInventoryId: varchar("seller_inventory_id").references(() => dealerInventory.id),
  sellerCarId: varchar("seller_car_id").references(() => cars.id), // For main inventory matches
  buyerBudget: decimal("buyer_budget", { precision: 12, scale: 2 }).notNull(),
  sellerAskingPrice: decimal("seller_asking_price", { precision: 12, scale: 2 }), // HIDDEN from buyer
  matchScore: decimal("match_score", { precision: 5, scale: 2 }), // 0-100 score
  matchDetails: jsonb("match_details"), // Breakdown of why matched (make/model, year, km, price alignment)
  status: varchar("status").notNull().default("new"), // new, notified, buyer_interested, admin_contacted, completed, expired
  adminNotified: boolean("admin_notified").notNull().default(false),
  adminNotifiedAt: timestamp("admin_notified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_dealer_matches_buyer").on(table.buyerDealershipId),
  index("IDX_dealer_matches_seller").on(table.sellerDealershipId),
  index("IDX_dealer_matches_status").on(table.status),
  index("IDX_dealer_matches_score").on(table.matchScore),
]);

export type DealerMatch = typeof dealerMatches.$inferSelect;
export type InsertDealerMatch = typeof dealerMatches.$inferInsert;

// Dealer Notifications - Notifications for dealers about matches, interests, etc.
export const dealerNotifications = pgTable("dealer_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealershipId: varchar("dealership_id").references(() => dealerships.id).notNull(),
  userId: varchar("user_id").references(() => users.id), // Specific user or null for all dealership users
  type: varchar("type").notNull(), // match_found, interest_received, admin_contact, listing_approved
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  relatedMatchId: varchar("related_match_id").references(() => dealerMatches.id),
  relatedInterestId: varchar("related_interest_id").references(() => interestRequests.id),
  relatedInventoryId: varchar("related_inventory_id").references(() => dealerInventory.id),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_dealer_notifications_dealership").on(table.dealershipId),
  index("IDX_dealer_notifications_user").on(table.userId),
  index("IDX_dealer_notifications_read").on(table.isRead),
  index("IDX_dealer_notifications_created").on(table.createdAt),
]);

export type DealerNotification = typeof dealerNotifications.$inferSelect;
export type InsertDealerNotification = typeof dealerNotifications.$inferInsert;
