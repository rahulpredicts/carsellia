import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, ilike, or, and, sql as sqlFn, count, gte, lte, inArray, like, asc } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { 
  Dealership, 
  InsertDealership, 
  UpdateDealership,
  Car,
  InsertCar,
  UpdateCar,
  User,
  UpsertUser,
  CreateUserInput,
  UpdateUserInput,
  DataSubmission,
  InsertDataSubmission,
  ReviewLog,
  InsertReviewLog,
  UserDealership,
  InsertUserDealership,
  DealerInventory,
  InsertDealerInventory,
  AppraisalHistory,
  InsertAppraisalHistory,
  InterestRequest,
  InsertInterestRequest,
  DealerMatch,
  InsertDealerMatch,
  DealerNotification,
  InsertDealerNotification
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface CarFilterParams {
  dealershipId?: string;
  search?: string;
  status?: string;
  make?: string;
  model?: string;
  vin?: string;
  vinStart?: string;
  color?: string;
  trim?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  kmsMin?: number;
  kmsMax?: number;
  province?: string;
  transmission?: string[];
  drivetrain?: string[];
  fuelType?: string[];
  bodyType?: string[];
  engineCylinders?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IStorage {
  // User operations - Required for Replit Auth and admin user management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createPasswordUser(userData: CreateUserInput, passwordHash: string): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUser(id: string, data: UpdateUserInput): Promise<User | undefined>;
  updateUserPassword(id: string, passwordHash: string): Promise<User | undefined>;
  updateUserLastLogin(id: string): Promise<void>;
  setPasswordResetToken(id: string, token: string, expiry: Date): Promise<User | undefined>;
  clearPasswordResetToken(id: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Dealership operations
  getAllDealerships(): Promise<Dealership[]>;
  getDealership(id: string): Promise<Dealership | undefined>;
  getDealershipByName(name: string): Promise<Dealership | undefined>;
  createDealership(dealership: InsertDealership): Promise<Dealership>;
  updateDealership(id: string, dealership: UpdateDealership): Promise<Dealership | undefined>;
  deleteDealership(id: string): Promise<boolean>;
  
  // Car operations
  getAllCars(): Promise<Car[]>;
  getCarsPaginated(params: PaginationParams, filters?: CarFilterParams): Promise<PaginatedResult<Car>>;
  getCarsByDealership(dealershipId: string): Promise<Car[]>;
  getCar(id: string): Promise<Car | undefined>;
  getCarByVin(vin: string): Promise<Car | undefined>;
  getCarByStockNumber(stockNumber: string): Promise<Car | undefined>;
  createCar(car: InsertCar): Promise<Car>;
  updateCar(id: string, car: UpdateCar): Promise<Car | undefined>;
  deleteCar(id: string): Promise<boolean>;
  searchCars(query: string): Promise<Car[]>;
  getCarsCount(dealershipId?: string, status?: string): Promise<{ total: number; available: number; sold: number; pending: number }>;
  getCarCountsByDealership(): Promise<Record<string, number>>;

  // Transport quote operations
  createTransportQuote(quote: schema.InsertTransportQuote): Promise<schema.TransportQuote>;
  getTransportQuote(id: string): Promise<schema.TransportQuote | undefined>;
  getTransportQuoteByNumber(quoteNumber: string): Promise<schema.TransportQuote | undefined>;
  getAllTransportQuotes(): Promise<schema.TransportQuote[]>;
  getTransportQuotesByUser(userId: string): Promise<schema.TransportQuote[]>;

  // Data Analyst Module - Submissions
  createDataSubmission(submission: InsertDataSubmission): Promise<DataSubmission>;
  getDataSubmission(id: string): Promise<DataSubmission | undefined>;
  updateDataSubmission(id: string, data: Partial<InsertDataSubmission>): Promise<DataSubmission | undefined>;
  deleteDataSubmission(id: string): Promise<boolean>;
  getSubmissionsByScraper(scraperId: string): Promise<DataSubmission[]>;
  getSubmissionsBySupervisor(supervisorId: string, status?: string): Promise<DataSubmission[]>;
  getPendingSupervisorSubmissions(supervisorId: string): Promise<DataSubmission[]>;
  getPendingManagerSubmissions(): Promise<DataSubmission[]>;
  getAllSubmissions(status?: string): Promise<DataSubmission[]>;
  getSubmissionStats(userId: string, role: string): Promise<{pending: number; approved: number; rejected: number; total: number}>;

  // Data Analyst Module - Review Logs
  createReviewLog(log: InsertReviewLog): Promise<ReviewLog>;
  getReviewLogsBySubmission(submissionId: string): Promise<ReviewLog[]>;
  getReviewLogsByReviewer(reviewerId: string): Promise<ReviewLog[]>;

  // Data Analyst Module - User queries
  getScrapersBySupervisor(supervisorId: string): Promise<User[]>;
  getAllSupervisors(): Promise<User[]>;
  getAllManagers(): Promise<User[]>;
  getAllScrapers(): Promise<User[]>;

  // ============================================
  // DEALER PORTAL (B2B) MODULE
  // ============================================

  // User-Dealership associations
  getUserDealership(userId: string): Promise<UserDealership | undefined>;
  createUserDealership(data: InsertUserDealership): Promise<UserDealership>;
  getDealershipUsers(dealershipId: string): Promise<User[]>;
  removeUserFromDealership(userId: string, dealershipId: string): Promise<boolean>;

  // Dealer Inventory - Private vehicle inventory for each dealership
  createDealerInventory(data: InsertDealerInventory): Promise<DealerInventory>;
  getDealerInventory(id: string): Promise<DealerInventory | undefined>;
  updateDealerInventory(id: string, data: Partial<InsertDealerInventory>): Promise<DealerInventory | undefined>;
  deleteDealerInventory(id: string): Promise<boolean>;
  getDealershipInventory(dealershipId: string, status?: string): Promise<DealerInventory[]>;
  getMarketplaceListings(excludeDealershipId?: string): Promise<Omit<DealerInventory, 'askingPrice' | 'buyBudgetSimilar' | 'dealershipId'>[]>;
  searchDealerInventory(dealershipId: string, query: string): Promise<DealerInventory[]>;

  // Appraisal History
  createAppraisalHistory(data: InsertAppraisalHistory): Promise<AppraisalHistory>;
  getAppraisalHistory(id: string): Promise<AppraisalHistory | undefined>;
  getDealershipAppraisals(dealershipId: string): Promise<AppraisalHistory[]>;
  getUserAppraisals(userId: string): Promise<AppraisalHistory[]>;
  getSimilarAppraisals(dealershipId: string, make: string, model: string, yearRange?: number): Promise<AppraisalHistory[]>;

  // Interest Requests
  createInterestRequest(data: InsertInterestRequest): Promise<InterestRequest>;
  getInterestRequest(id: string): Promise<InterestRequest | undefined>;
  getInterestRequestById(id: number): Promise<InterestRequest | undefined>;
  updateInterestRequest(id: string, data: Partial<InsertInterestRequest>): Promise<InterestRequest | undefined>;
  updateInterestRequestStatus(id: number, status: string, adminNotes?: string): Promise<InterestRequest | undefined>;
  getDealershipInterestRequests(dealershipId: string): Promise<InterestRequest[]>;
  getPendingInterestRequests(): Promise<InterestRequest[]>;
  getAllInterestRequests(): Promise<InterestRequest[]>;
  getAllInterestRequestsForAdmin(): Promise<any[]>;
  
  // Admin Dashboard Methods
  getAllDealerInventoryForAdmin(): Promise<any[]>;

  // Smart Matching
  createDealerMatch(data: InsertDealerMatch): Promise<DealerMatch>;
  getDealerMatch(id: string): Promise<DealerMatch | undefined>;
  updateDealerMatch(id: string, data: Partial<InsertDealerMatch>): Promise<DealerMatch | undefined>;
  getDealershipMatches(dealershipId: string): Promise<DealerMatch[]>;
  getNewMatchesForAdmin(): Promise<DealerMatch[]>;
  findPotentialMatches(make: string, model: string, year: number, buyBudget: number): Promise<{listings: DealerInventory[]; mainInventory: Car[]}>;

  // Dealer Notifications
  createDealerNotification(data: InsertDealerNotification): Promise<DealerNotification>;
  getDealerNotifications(dealershipId: string, userId?: string): Promise<DealerNotification[]>;
  markNotificationRead(id: string): Promise<DealerNotification | undefined>;
  getUnreadNotificationCount(dealershipId: string, userId?: string): Promise<number>;

  // ============================================
  // TRANSPORT ORDER MODULE
  // ============================================

  // Transport Orders - CRUD
  createTransportOrder(order: schema.InsertTransportOrder): Promise<schema.TransportOrder>;
  getTransportOrder(id: string): Promise<schema.TransportOrder | undefined>;
  getTransportOrderByNumber(orderNumber: string): Promise<schema.TransportOrder | undefined>;
  updateTransportOrder(id: string, data: Partial<schema.InsertTransportOrder>): Promise<schema.TransportOrder | undefined>;
  getTransportOrdersByUser(userId: string): Promise<schema.TransportOrder[]>;
  getTransportOrdersByDriver(driverId: string): Promise<schema.TransportOrder[]>;
  getAllTransportOrders(status?: string): Promise<schema.TransportOrder[]>;
  
  // Order Status History
  createOrderStatusHistory(history: schema.InsertOrderStatusHistory): Promise<schema.OrderStatusHistory>;
  getOrderStatusHistory(orderId: string): Promise<schema.OrderStatusHistory[]>;
  
  // Order Documents
  createOrderDocument(doc: schema.InsertOrderDocument): Promise<schema.OrderDocument>;
  getOrderDocument(id: string): Promise<schema.OrderDocument | undefined>;
  updateOrderDocument(id: string, data: Partial<schema.InsertOrderDocument>): Promise<schema.OrderDocument | undefined>;
  deleteOrderDocument(id: string): Promise<boolean>;
  getOrderDocuments(orderId: string): Promise<schema.OrderDocument[]>;
  
  // Transport Notifications
  createTransportNotification(notification: schema.InsertTransportNotification): Promise<schema.TransportNotification>;
  getTransportNotifications(userId: string): Promise<schema.TransportNotification[]>;
  getTransportNotificationsByOrder(orderId: string): Promise<schema.TransportNotification[]>;
  markTransportNotificationRead(id: string): Promise<schema.TransportNotification | undefined>;
  markAllTransportNotificationsRead(userId: string): Promise<number>;
  getUnreadTransportNotificationCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations - Required for Replit Auth and admin user management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(userData)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createPasswordUser(userData: CreateUserInput, passwordHash: string): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        passwordHash,
        authType: 'password',
        isActive: 'true',
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({ role, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({ 
        passwordHash, 
        passwordResetToken: null, 
        passwordResetExpiry: null,
        updatedAt: new Date() 
      })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, id));
  }

  async setPasswordResetToken(id: string, token: string, expiry: Date): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({ 
        passwordResetToken: token, 
        passwordResetExpiry: expiry,
        updatedAt: new Date() 
      })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async clearPasswordResetToken(id: string): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({ 
        passwordResetToken: null, 
        passwordResetExpiry: null,
        updatedAt: new Date() 
      })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const results = await db.delete(schema.users).where(eq(schema.users.id, id)).returning();
    return results.length > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
  }

  // Dealership operations
  async getAllDealerships(): Promise<Dealership[]> {
    return await db.select().from(schema.dealerships).orderBy(desc(schema.dealerships.createdAt));
  }

  async getDealership(id: string): Promise<Dealership | undefined> {
    const results = await db.select().from(schema.dealerships).where(eq(schema.dealerships.id, id));
    return results[0];
  }

  async getDealershipByName(name: string): Promise<Dealership | undefined> {
    const results = await db.select().from(schema.dealerships).where(ilike(schema.dealerships.name, name.trim()));
    return results[0];
  }

  async createDealership(dealership: InsertDealership): Promise<Dealership> {
    const results = await db.insert(schema.dealerships).values(dealership).returning();
    return results[0];
  }

  async updateDealership(id: string, dealership: UpdateDealership): Promise<Dealership | undefined> {
    const results = await db.update(schema.dealerships)
      .set(dealership)
      .where(eq(schema.dealerships.id, id))
      .returning();
    return results[0];
  }

  async deleteDealership(id: string): Promise<boolean> {
    const results = await db.delete(schema.dealerships).where(eq(schema.dealerships.id, id)).returning();
    return results.length > 0;
  }

  // Car operations
  async getAllCars(): Promise<Car[]> {
    return await db.select().from(schema.cars).orderBy(desc(schema.cars.createdAt));
  }

  async getCarsPaginated(
    params: PaginationParams, 
    filters?: CarFilterParams
  ): Promise<PaginatedResult<Car>> {
    const { page, pageSize } = params;
    const offset = (page - 1) * pageSize;
    
    const conditions: any[] = [];
    
    if (filters?.dealershipId) {
      conditions.push(eq(schema.cars.dealershipId, filters.dealershipId));
    }
    
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(schema.cars.status, filters.status));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(schema.cars.vin, searchTerm),
          ilike(schema.cars.make, searchTerm),
          ilike(schema.cars.model, searchTerm),
          ilike(schema.cars.trim, searchTerm),
          ilike(schema.cars.year, searchTerm),
          ilike(schema.cars.color, searchTerm),
          ilike(schema.cars.stockNumber, searchTerm)
        )
      );
    }
    
    if (filters?.make) {
      conditions.push(ilike(schema.cars.make, `%${filters.make}%`));
    }
    
    if (filters?.model) {
      conditions.push(ilike(schema.cars.model, `%${filters.model}%`));
    }
    
    if (filters?.vin) {
      conditions.push(ilike(schema.cars.vin, `%${filters.vin}%`));
    }
    
    if (filters?.vinStart) {
      conditions.push(like(schema.cars.vin, `${filters.vinStart}%`));
    }
    
    if (filters?.color) {
      conditions.push(ilike(schema.cars.color, `%${filters.color}%`));
    }
    
    if (filters?.trim) {
      conditions.push(ilike(schema.cars.trim, `%${filters.trim}%`));
    }
    
    if (filters?.yearMin !== undefined) {
      conditions.push(gte(sqlFn`CAST(${schema.cars.year} AS INTEGER)`, filters.yearMin));
    }
    
    if (filters?.yearMax !== undefined) {
      conditions.push(lte(sqlFn`CAST(${schema.cars.year} AS INTEGER)`, filters.yearMax));
    }
    
    if (filters?.priceMin !== undefined) {
      conditions.push(gte(sqlFn`CAST(${schema.cars.price} AS NUMERIC)`, filters.priceMin));
    }
    
    if (filters?.priceMax !== undefined) {
      conditions.push(lte(sqlFn`CAST(${schema.cars.price} AS NUMERIC)`, filters.priceMax));
    }
    
    if (filters?.kmsMin !== undefined) {
      conditions.push(gte(sqlFn`CAST(${schema.cars.kilometers} AS NUMERIC)`, filters.kmsMin));
    }
    
    if (filters?.kmsMax !== undefined) {
      conditions.push(lte(sqlFn`CAST(${schema.cars.kilometers} AS NUMERIC)`, filters.kmsMax));
    }
    
    if (filters?.transmission && filters.transmission.length > 0) {
      conditions.push(inArray(schema.cars.transmission, filters.transmission));
    }
    
    if (filters?.drivetrain && filters.drivetrain.length > 0) {
      conditions.push(inArray(schema.cars.drivetrain, filters.drivetrain));
    }
    
    if (filters?.fuelType && filters.fuelType.length > 0) {
      conditions.push(inArray(schema.cars.fuelType, filters.fuelType));
    }
    
    if (filters?.bodyType && filters.bodyType.length > 0) {
      conditions.push(inArray(schema.cars.bodyType, filters.bodyType));
    }
    
    if (filters?.engineCylinders && filters.engineCylinders.length > 0) {
      conditions.push(inArray(schema.cars.engineCylinders, filters.engineCylinders));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Map sortBy field to database column
    const getSortColumn = (field: string) => {
      const fieldMap: any = {
        'price': schema.cars.price,
        'year': schema.cars.year,
        'kilometers': schema.cars.kilometers,
        'addedDate': schema.cars.createdAt,
        'make': schema.cars.make,
        'model': schema.cars.model
      };
      return fieldMap[field] || schema.cars.createdAt;
    };
    
    const sortColumn = filters?.sortBy ? getSortColumn(filters.sortBy) : schema.cars.createdAt;
    const isAscending = filters?.sortOrder === 'asc';
    
    const [countResult, data] = await Promise.all([
      db.select({ count: count() }).from(schema.cars).where(whereClause),
      db.select().from(schema.cars)
        .where(whereClause)
        .orderBy(isAscending ? asc(sortColumn) : desc(sortColumn))
        .limit(pageSize)
        .offset(offset)
    ]);
    
    const total = countResult[0]?.count || 0;
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async getCarsCount(dealershipId?: string, status?: string): Promise<{ total: number; available: number; sold: number; pending: number }> {
    const dealershipCondition = dealershipId ? eq(schema.cars.dealershipId, dealershipId) : undefined;
    
    const [totalResult, availableResult, soldResult, pendingResult] = await Promise.all([
      db.select({ count: count() }).from(schema.cars).where(dealershipCondition),
      db.select({ count: count() }).from(schema.cars).where(
        dealershipCondition 
          ? and(dealershipCondition, eq(schema.cars.status, 'available'))
          : eq(schema.cars.status, 'available')
      ),
      db.select({ count: count() }).from(schema.cars).where(
        dealershipCondition 
          ? and(dealershipCondition, eq(schema.cars.status, 'sold'))
          : eq(schema.cars.status, 'sold')
      ),
      db.select({ count: count() }).from(schema.cars).where(
        dealershipCondition 
          ? and(dealershipCondition, eq(schema.cars.status, 'pending'))
          : eq(schema.cars.status, 'pending')
      )
    ]);
    
    return {
      total: totalResult[0]?.count || 0,
      available: availableResult[0]?.count || 0,
      sold: soldResult[0]?.count || 0,
      pending: pendingResult[0]?.count || 0
    };
  }

  async getCarsByDealership(dealershipId: string): Promise<Car[]> {
    return await db.select().from(schema.cars)
      .where(eq(schema.cars.dealershipId, dealershipId))
      .orderBy(desc(schema.cars.createdAt));
  }

  async getCar(id: string): Promise<Car | undefined> {
    const results = await db.select().from(schema.cars).where(eq(schema.cars.id, id));
    return results[0];
  }

  async getCarByVin(vin: string): Promise<Car | undefined> {
    const results = await db.select().from(schema.cars).where(eq(schema.cars.vin, vin));
    return results[0];
  }

  async getCarByStockNumber(stockNumber: string): Promise<Car | undefined> {
    const results = await db.select().from(schema.cars).where(eq(schema.cars.stockNumber, stockNumber));
    return results[0];
  }

  async createCar(car: InsertCar): Promise<Car> {
    const results = await db.insert(schema.cars).values(car).returning();
    return results[0];
  }

  async updateCar(id: string, car: UpdateCar): Promise<Car | undefined> {
    const results = await db.update(schema.cars)
      .set(car)
      .where(eq(schema.cars.id, id))
      .returning();
    return results[0];
  }

  async deleteCar(id: string): Promise<boolean> {
    const results = await db.delete(schema.cars).where(eq(schema.cars.id, id)).returning();
    return results.length > 0;
  }

  async searchCars(query: string): Promise<Car[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(schema.cars)
      .where(
        or(
          ilike(schema.cars.vin, searchTerm),
          ilike(schema.cars.make, searchTerm),
          ilike(schema.cars.model, searchTerm),
          ilike(schema.cars.trim, searchTerm),
          ilike(schema.cars.year, searchTerm),
          ilike(schema.cars.color, searchTerm),
          ilike(schema.cars.bodyType, searchTerm),
          ilike(schema.cars.fuelType, searchTerm),
          ilike(schema.cars.drivetrain, searchTerm),
          ilike(schema.cars.notes, searchTerm)
        )
      )
      .orderBy(desc(schema.cars.createdAt));
  }

  async getCarCountsByDealership(): Promise<Record<string, number>> {
    const results = await db.select({
      dealershipId: schema.cars.dealershipId,
      count: count()
    })
    .from(schema.cars)
    .groupBy(schema.cars.dealershipId);
    
    const counts: Record<string, number> = {};
    for (const row of results) {
      counts[row.dealershipId] = row.count;
    }
    return counts;
  }

  // Transport quote operations
  async createTransportQuote(quote: schema.InsertTransportQuote): Promise<schema.TransportQuote> {
    const results = await db.insert(schema.transportQuotes).values(quote).returning();
    return results[0];
  }

  async getTransportQuote(id: string): Promise<schema.TransportQuote | undefined> {
    const results = await db.select().from(schema.transportQuotes).where(eq(schema.transportQuotes.id, id));
    return results[0];
  }

  async getTransportQuoteByNumber(quoteNumber: string): Promise<schema.TransportQuote | undefined> {
    const results = await db.select().from(schema.transportQuotes).where(eq(schema.transportQuotes.quoteNumber, quoteNumber));
    return results[0];
  }

  async getAllTransportQuotes(): Promise<schema.TransportQuote[]> {
    return await db.select().from(schema.transportQuotes).orderBy(desc(schema.transportQuotes.createdAt));
  }

  async getTransportQuotesByUser(userId: string): Promise<schema.TransportQuote[]> {
    return await db.select().from(schema.transportQuotes)
      .where(eq(schema.transportQuotes.userId, userId))
      .orderBy(desc(schema.transportQuotes.createdAt));
  }

  // ============================================
  // DATA ANALYST MODULE - SUBMISSIONS
  // ============================================

  async createDataSubmission(submission: InsertDataSubmission): Promise<DataSubmission> {
    const results = await db.insert(schema.dataSubmissions).values(submission).returning();
    return results[0];
  }

  async getDataSubmission(id: string): Promise<DataSubmission | undefined> {
    const results = await db.select().from(schema.dataSubmissions).where(eq(schema.dataSubmissions.id, id));
    return results[0];
  }

  async updateDataSubmission(id: string, data: Partial<InsertDataSubmission>): Promise<DataSubmission | undefined> {
    const results = await db.update(schema.dataSubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.dataSubmissions.id, id))
      .returning();
    return results[0];
  }

  async deleteDataSubmission(id: string): Promise<boolean> {
    const results = await db.delete(schema.dataSubmissions).where(eq(schema.dataSubmissions.id, id)).returning();
    return results.length > 0;
  }

  async getSubmissionsByScraper(scraperId: string): Promise<DataSubmission[]> {
    return await db.select().from(schema.dataSubmissions)
      .where(eq(schema.dataSubmissions.scraperId, scraperId))
      .orderBy(desc(schema.dataSubmissions.createdAt));
  }

  async getSubmissionsBySupervisor(supervisorId: string, status?: string): Promise<DataSubmission[]> {
    const conditions = [eq(schema.dataSubmissions.supervisorId, supervisorId)];
    if (status) {
      conditions.push(eq(schema.dataSubmissions.status, status));
    }
    return await db.select().from(schema.dataSubmissions)
      .where(and(...conditions))
      .orderBy(desc(schema.dataSubmissions.createdAt));
  }

  async getPendingSupervisorSubmissions(supervisorId: string): Promise<DataSubmission[]> {
    // Get all scrapers assigned to this supervisor
    const scrapers = await this.getScrapersBySupervisor(supervisorId);
    const scraperIds = scrapers.map(s => s.id);
    
    if (scraperIds.length === 0) {
      return [];
    }
    
    return await db.select().from(schema.dataSubmissions)
      .where(and(
        inArray(schema.dataSubmissions.scraperId, scraperIds),
        eq(schema.dataSubmissions.status, "pending_supervisor")
      ))
      .orderBy(desc(schema.dataSubmissions.createdAt));
  }

  async getPendingManagerSubmissions(): Promise<DataSubmission[]> {
    return await db.select().from(schema.dataSubmissions)
      .where(eq(schema.dataSubmissions.status, "pending_manager"))
      .orderBy(desc(schema.dataSubmissions.createdAt));
  }

  async getAllSubmissions(status?: string): Promise<DataSubmission[]> {
    if (status) {
      return await db.select().from(schema.dataSubmissions)
        .where(eq(schema.dataSubmissions.status, status))
        .orderBy(desc(schema.dataSubmissions.createdAt));
    }
    return await db.select().from(schema.dataSubmissions)
      .orderBy(desc(schema.dataSubmissions.createdAt));
  }

  async getSubmissionStats(userId: string, role: string): Promise<{pending: number; approved: number; rejected: number; total: number}> {
    let submissions: DataSubmission[];
    
    if (role === 'scraper') {
      submissions = await this.getSubmissionsByScraper(userId);
    } else if (role === 'supervisor') {
      submissions = await this.getPendingSupervisorSubmissions(userId);
      const approved = await this.getSubmissionsBySupervisor(userId, 'pending_manager');
      submissions = [...submissions, ...approved];
    } else {
      submissions = await this.getAllSubmissions();
    }

    return {
      pending: submissions.filter(s => s.status === 'pending_supervisor' || s.status === 'pending_manager').length,
      approved: submissions.filter(s => s.status === 'approved' || s.status === 'uploaded').length,
      rejected: submissions.filter(s => s.status === 'rejected').length,
      total: submissions.length
    };
  }

  // ============================================
  // DATA ANALYST MODULE - REVIEW LOGS
  // ============================================

  async createReviewLog(log: InsertReviewLog): Promise<ReviewLog> {
    const results = await db.insert(schema.reviewLogs).values(log).returning();
    return results[0];
  }

  async getReviewLogsBySubmission(submissionId: string): Promise<ReviewLog[]> {
    return await db.select().from(schema.reviewLogs)
      .where(eq(schema.reviewLogs.submissionId, submissionId))
      .orderBy(desc(schema.reviewLogs.createdAt));
  }

  async getReviewLogsByReviewer(reviewerId: string): Promise<ReviewLog[]> {
    return await db.select().from(schema.reviewLogs)
      .where(eq(schema.reviewLogs.reviewerId, reviewerId))
      .orderBy(desc(schema.reviewLogs.createdAt));
  }

  // ============================================
  // DATA ANALYST MODULE - USER QUERIES
  // ============================================

  async getScrapersBySupervisor(supervisorId: string): Promise<User[]> {
    return await db.select().from(schema.users)
      .where(and(
        eq(schema.users.role, 'scraper'),
        eq(schema.users.assignedSupervisorId, supervisorId)
      ))
      .orderBy(asc(schema.users.firstName));
  }

  async getAllSupervisors(): Promise<User[]> {
    return await db.select().from(schema.users)
      .where(eq(schema.users.role, 'supervisor'))
      .orderBy(asc(schema.users.firstName));
  }

  async getAllManagers(): Promise<User[]> {
    return await db.select().from(schema.users)
      .where(eq(schema.users.role, 'manager'))
      .orderBy(asc(schema.users.firstName));
  }

  async getAllScrapers(): Promise<User[]> {
    return await db.select().from(schema.users)
      .where(eq(schema.users.role, 'scraper'))
      .orderBy(asc(schema.users.firstName));
  }

  // ============================================
  // DEALER PORTAL (B2B) MODULE
  // ============================================

  // User-Dealership associations
  async getUserDealership(userId: string): Promise<UserDealership | undefined> {
    const [result] = await db.select().from(schema.userDealerships)
      .where(eq(schema.userDealerships.userId, userId));
    return result;
  }

  async createUserDealership(data: InsertUserDealership): Promise<UserDealership> {
    const [result] = await db.insert(schema.userDealerships).values(data).returning();
    return result;
  }

  async getDealershipUsers(dealershipId: string): Promise<User[]> {
    const userDealerships = await db.select().from(schema.userDealerships)
      .where(and(
        eq(schema.userDealerships.dealershipId, dealershipId),
        eq(schema.userDealerships.isActive, true)
      ));
    
    if (userDealerships.length === 0) return [];
    
    const userIds = userDealerships.map(ud => ud.userId);
    return await db.select().from(schema.users)
      .where(inArray(schema.users.id, userIds))
      .orderBy(asc(schema.users.firstName));
  }

  async removeUserFromDealership(userId: string, dealershipId: string): Promise<boolean> {
    const result = await db.delete(schema.userDealerships)
      .where(and(
        eq(schema.userDealerships.userId, userId),
        eq(schema.userDealerships.dealershipId, dealershipId)
      ));
    return true;
  }

  // Dealer Inventory - Private vehicle inventory for each dealership
  async createDealerInventory(data: InsertDealerInventory): Promise<DealerInventory> {
    const [result] = await db.insert(schema.dealerInventory).values(data).returning();
    return result;
  }

  async getDealerInventory(id: string): Promise<DealerInventory | undefined> {
    const [result] = await db.select().from(schema.dealerInventory)
      .where(eq(schema.dealerInventory.id, id));
    return result;
  }

  async updateDealerInventory(id: string, data: Partial<InsertDealerInventory>): Promise<DealerInventory | undefined> {
    const [result] = await db.update(schema.dealerInventory)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.dealerInventory.id, id))
      .returning();
    return result;
  }

  async deleteDealerInventory(id: string): Promise<boolean> {
    await db.delete(schema.dealerInventory)
      .where(eq(schema.dealerInventory.id, id));
    return true;
  }

  async getDealershipInventory(dealershipId: string, status?: string): Promise<DealerInventory[]> {
    const conditions = [eq(schema.dealerInventory.dealershipId, dealershipId)];
    if (status) {
      conditions.push(eq(schema.dealerInventory.status, status));
    }
    return await db.select().from(schema.dealerInventory)
      .where(and(...conditions))
      .orderBy(desc(schema.dealerInventory.createdAt));
  }

  async getMarketplaceListings(excludeDealershipId?: string): Promise<any[]> {
    const conditions = [
      eq(schema.dealerInventory.listOnMarketplace, true),
      eq(schema.dealerInventory.status, 'available')
    ];
    if (excludeDealershipId) {
      conditions.push(sqlFn`${schema.dealerInventory.dealershipId} != ${excludeDealershipId}`);
    }
    
    const listings = await db.select({
      id: schema.dealerInventory.id,
      vin: schema.dealerInventory.vin,
      stockNumber: schema.dealerInventory.stockNumber,
      make: schema.dealerInventory.make,
      model: schema.dealerInventory.model,
      year: schema.dealerInventory.year,
      trim: schema.dealerInventory.trim,
      color: schema.dealerInventory.color,
      kilometers: schema.dealerInventory.kilometers,
      condition: schema.dealerInventory.condition,
      transmission: schema.dealerInventory.transmission,
      fuelType: schema.dealerInventory.fuelType,
      bodyType: schema.dealerInventory.bodyType,
      drivetrain: schema.dealerInventory.drivetrain,
      photos: schema.dealerInventory.photos,
      notes: schema.dealerInventory.notes,
      status: schema.dealerInventory.status,
      createdAt: schema.dealerInventory.createdAt,
    }).from(schema.dealerInventory)
      .where(and(...conditions))
      .orderBy(desc(schema.dealerInventory.createdAt));
    
    return listings;
  }

  async searchDealerInventory(dealershipId: string, query: string): Promise<DealerInventory[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    return await db.select().from(schema.dealerInventory)
      .where(and(
        eq(schema.dealerInventory.dealershipId, dealershipId),
        or(
          ilike(schema.dealerInventory.make, searchPattern),
          ilike(schema.dealerInventory.model, searchPattern),
          ilike(schema.dealerInventory.vin || '', searchPattern),
          ilike(schema.dealerInventory.stockNumber || '', searchPattern)
        )
      ))
      .orderBy(desc(schema.dealerInventory.createdAt));
  }

  // Appraisal History
  async createAppraisalHistory(data: InsertAppraisalHistory): Promise<AppraisalHistory> {
    const [result] = await db.insert(schema.appraisalHistory).values(data).returning();
    return result;
  }

  async getAppraisalHistory(id: string): Promise<AppraisalHistory | undefined> {
    const [result] = await db.select().from(schema.appraisalHistory)
      .where(eq(schema.appraisalHistory.id, id));
    return result;
  }

  async getDealershipAppraisals(dealershipId: string): Promise<AppraisalHistory[]> {
    return await db.select().from(schema.appraisalHistory)
      .where(eq(schema.appraisalHistory.dealershipId, dealershipId))
      .orderBy(desc(schema.appraisalHistory.createdAt));
  }

  async getUserAppraisals(userId: string): Promise<AppraisalHistory[]> {
    return await db.select().from(schema.appraisalHistory)
      .where(eq(schema.appraisalHistory.userId, userId))
      .orderBy(desc(schema.appraisalHistory.createdAt));
  }

  async getSimilarAppraisals(dealershipId: string, make: string, model: string, yearRange: number = 2): Promise<AppraisalHistory[]> {
    return await db.select().from(schema.appraisalHistory)
      .where(and(
        eq(schema.appraisalHistory.dealershipId, dealershipId),
        ilike(schema.appraisalHistory.make, make),
        ilike(schema.appraisalHistory.model, model)
      ))
      .orderBy(desc(schema.appraisalHistory.createdAt))
      .limit(10);
  }

  // Interest Requests
  async createInterestRequest(data: InsertInterestRequest): Promise<InterestRequest> {
    const [result] = await db.insert(schema.interestRequests).values(data).returning();
    return result;
  }

  async getInterestRequest(id: string): Promise<InterestRequest | undefined> {
    const [result] = await db.select().from(schema.interestRequests)
      .where(eq(schema.interestRequests.id, id));
    return result;
  }

  async updateInterestRequest(id: string, data: Partial<InsertInterestRequest>): Promise<InterestRequest | undefined> {
    const [result] = await db.update(schema.interestRequests)
      .set(data)
      .where(eq(schema.interestRequests.id, id))
      .returning();
    return result;
  }

  async getDealershipInterestRequests(dealershipId: string): Promise<InterestRequest[]> {
    return await db.select().from(schema.interestRequests)
      .where(eq(schema.interestRequests.requestingDealershipId, dealershipId))
      .orderBy(desc(schema.interestRequests.createdAt));
  }

  async getPendingInterestRequests(): Promise<InterestRequest[]> {
    return await db.select().from(schema.interestRequests)
      .where(eq(schema.interestRequests.status, 'pending'))
      .orderBy(desc(schema.interestRequests.createdAt));
  }

  async getAllInterestRequests(): Promise<InterestRequest[]> {
    return await db.select().from(schema.interestRequests)
      .orderBy(desc(schema.interestRequests.createdAt));
  }

  async getInterestRequestById(id: number): Promise<InterestRequest | undefined> {
    const [result] = await db.select().from(schema.interestRequests)
      .where(eq(schema.interestRequests.id, id));
    return result;
  }

  async updateInterestRequestStatus(id: number, status: string, adminNotes?: string): Promise<InterestRequest | undefined> {
    const updateData: any = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    const [result] = await db.update(schema.interestRequests)
      .set(updateData)
      .where(eq(schema.interestRequests.id, id))
      .returning();
    return result;
  }

  async getAllInterestRequestsForAdmin(): Promise<any[]> {
    const requests = await db.select().from(schema.interestRequests)
      .orderBy(desc(schema.interestRequests.createdAt));
    
    const enrichedRequests = await Promise.all(requests.map(async (req) => {
      const [buyerDealer] = await db.select().from(schema.dealerships)
        .where(eq(schema.dealerships.id, req.buyerDealerId.toString()));
      const [sellerDealer] = await db.select().from(schema.dealerships)
        .where(eq(schema.dealerships.id, req.sellerDealerId.toString()));
      const [inventory] = await db.select().from(schema.dealerInventory)
        .where(eq(schema.dealerInventory.id, req.inventoryId.toString()));
      
      return {
        ...req,
        buyerDealerName: buyerDealer?.name || `Dealer #${req.buyerDealerId}`,
        sellerDealerName: sellerDealer?.name || `Dealer #${req.sellerDealerId}`,
        vehicleMake: inventory?.make,
        vehicleModel: inventory?.model,
        vehicleYear: inventory?.year,
        sellingPrice: inventory?.askingPrice,
        buyBudget: inventory?.buyBudgetSimilar,
      };
    }));
    
    return enrichedRequests;
  }

  async getAllDealerInventoryForAdmin(): Promise<any[]> {
    const inventory = await db.select().from(schema.dealerInventory)
      .orderBy(desc(schema.dealerInventory.createdAt));
    
    const enrichedInventory = await Promise.all(inventory.map(async (item) => {
      const [dealer] = await db.select().from(schema.dealerships)
        .where(eq(schema.dealerships.id, item.dealershipId));
      
      return {
        ...item,
        sellingPrice: item.askingPrice,
        buyBudget: item.buyBudgetSimilar,
        dealerName: dealer?.name || `Dealer #${item.dealershipId}`,
        dealerId: parseInt(item.dealershipId),
      };
    }));
    
    return enrichedInventory;
  }

  // Smart Matching
  async createDealerMatch(data: InsertDealerMatch): Promise<DealerMatch> {
    const [result] = await db.insert(schema.dealerMatches).values(data).returning();
    return result;
  }

  async getDealerMatch(id: string): Promise<DealerMatch | undefined> {
    const [result] = await db.select().from(schema.dealerMatches)
      .where(eq(schema.dealerMatches.id, id));
    return result;
  }

  async updateDealerMatch(id: string, data: Partial<InsertDealerMatch>): Promise<DealerMatch | undefined> {
    const [result] = await db.update(schema.dealerMatches)
      .set(data)
      .where(eq(schema.dealerMatches.id, id))
      .returning();
    return result;
  }

  async getDealershipMatches(dealershipId: string): Promise<DealerMatch[]> {
    return await db.select().from(schema.dealerMatches)
      .where(or(
        eq(schema.dealerMatches.buyerDealershipId, dealershipId),
        eq(schema.dealerMatches.sellerDealershipId, dealershipId)
      ))
      .orderBy(desc(schema.dealerMatches.createdAt));
  }

  async getNewMatchesForAdmin(): Promise<DealerMatch[]> {
    return await db.select().from(schema.dealerMatches)
      .where(and(
        eq(schema.dealerMatches.status, 'new'),
        eq(schema.dealerMatches.adminNotified, false)
      ))
      .orderBy(desc(schema.dealerMatches.matchScore));
  }

  async findPotentialMatches(make: string, model: string, year: number, buyBudget: number): Promise<{listings: DealerInventory[]; mainInventory: Car[]}> {
    const yearMin = year - 2;
    const yearMax = year + 2;
    
    const listings = await db.select().from(schema.dealerInventory)
      .where(and(
        eq(schema.dealerInventory.listOnMarketplace, true),
        eq(schema.dealerInventory.status, 'available'),
        ilike(schema.dealerInventory.make, make),
        ilike(schema.dealerInventory.model, model),
        gte(schema.dealerInventory.year, yearMin),
        lte(schema.dealerInventory.year, yearMax)
      ))
      .orderBy(desc(schema.dealerInventory.createdAt))
      .limit(20);
    
    const mainInventory = await db.select().from(schema.cars)
      .where(and(
        eq(schema.cars.status, 'available'),
        ilike(schema.cars.make, make),
        ilike(schema.cars.model, model)
      ))
      .orderBy(desc(schema.cars.createdAt))
      .limit(20);
    
    return { listings, mainInventory };
  }

  // Dealer Notifications
  async createDealerNotification(data: InsertDealerNotification): Promise<DealerNotification> {
    const [result] = await db.insert(schema.dealerNotifications).values(data).returning();
    return result;
  }

  async getDealerNotifications(dealershipId: string, userId?: string): Promise<DealerNotification[]> {
    const conditions = [eq(schema.dealerNotifications.dealershipId, dealershipId)];
    if (userId) {
      conditions.push(or(
        eq(schema.dealerNotifications.userId, userId),
        sqlFn`${schema.dealerNotifications.userId} IS NULL`
      )!);
    }
    return await db.select().from(schema.dealerNotifications)
      .where(and(...conditions))
      .orderBy(desc(schema.dealerNotifications.createdAt))
      .limit(50);
  }

  async markNotificationRead(id: string): Promise<DealerNotification | undefined> {
    const [result] = await db.update(schema.dealerNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(schema.dealerNotifications.id, id))
      .returning();
    return result;
  }

  async getUnreadNotificationCount(dealershipId: string, userId?: string): Promise<number> {
    const conditions = [
      eq(schema.dealerNotifications.dealershipId, dealershipId),
      eq(schema.dealerNotifications.isRead, false)
    ];
    if (userId) {
      conditions.push(or(
        eq(schema.dealerNotifications.userId, userId),
        sqlFn`${schema.dealerNotifications.userId} IS NULL`
      )!);
    }
    const [result] = await db.select({ count: count() }).from(schema.dealerNotifications)
      .where(and(...conditions));
    return result?.count || 0;
  }

  // ============================================
  // TRANSPORT ORDER MODULE IMPLEMENTATIONS
  // ============================================

  async createTransportOrder(order: schema.InsertTransportOrder): Promise<schema.TransportOrder> {
    const [result] = await db.insert(schema.transportOrders).values(order).returning();
    return result;
  }

  async getTransportOrder(id: string): Promise<schema.TransportOrder | undefined> {
    const [result] = await db.select().from(schema.transportOrders)
      .where(eq(schema.transportOrders.id, id));
    return result;
  }

  async getTransportOrderByNumber(orderNumber: string): Promise<schema.TransportOrder | undefined> {
    const [result] = await db.select().from(schema.transportOrders)
      .where(eq(schema.transportOrders.orderNumber, orderNumber));
    return result;
  }

  async updateTransportOrder(id: string, data: Partial<schema.InsertTransportOrder>): Promise<schema.TransportOrder | undefined> {
    const [result] = await db.update(schema.transportOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.transportOrders.id, id))
      .returning();
    return result;
  }

  async getTransportOrdersByUser(userId: string): Promise<schema.TransportOrder[]> {
    return await db.select({
      order: schema.transportOrders,
      quote: schema.transportQuotes
    })
      .from(schema.transportOrders)
      .leftJoin(schema.transportQuotes, eq(schema.transportOrders.quoteId, schema.transportQuotes.id))
      .where(eq(schema.transportQuotes.userId, userId))
      .orderBy(desc(schema.transportOrders.createdAt))
      .then(rows => rows.map(r => r.order));
  }

  async getTransportOrdersByDriver(driverId: string): Promise<schema.TransportOrder[]> {
    return await db.select().from(schema.transportOrders)
      .where(eq(schema.transportOrders.driverId, driverId))
      .orderBy(desc(schema.transportOrders.createdAt));
  }

  async getAllTransportOrders(status?: string): Promise<schema.TransportOrder[]> {
    const conditions = [];
    if (status) {
      conditions.push(eq(schema.transportOrders.status, status));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(schema.transportOrders)
        .where(and(...conditions))
        .orderBy(desc(schema.transportOrders.createdAt));
    }
    
    return await db.select().from(schema.transportOrders)
      .orderBy(desc(schema.transportOrders.createdAt));
  }

  // Order Status History
  async createOrderStatusHistory(history: schema.InsertOrderStatusHistory): Promise<schema.OrderStatusHistory> {
    const [result] = await db.insert(schema.orderStatusHistory).values(history).returning();
    return result;
  }

  async getOrderStatusHistory(orderId: string): Promise<schema.OrderStatusHistory[]> {
    return await db.select().from(schema.orderStatusHistory)
      .where(eq(schema.orderStatusHistory.orderId, orderId))
      .orderBy(asc(schema.orderStatusHistory.createdAt));
  }

  // Order Documents
  async createOrderDocument(doc: schema.InsertOrderDocument): Promise<schema.OrderDocument> {
    const [result] = await db.insert(schema.orderDocuments).values(doc).returning();
    return result;
  }

  async getOrderDocument(id: string): Promise<schema.OrderDocument | undefined> {
    const [result] = await db.select().from(schema.orderDocuments)
      .where(eq(schema.orderDocuments.id, id));
    return result;
  }

  async updateOrderDocument(id: string, data: Partial<schema.InsertOrderDocument>): Promise<schema.OrderDocument | undefined> {
    const [result] = await db.update(schema.orderDocuments)
      .set(data)
      .where(eq(schema.orderDocuments.id, id))
      .returning();
    return result;
  }

  async deleteOrderDocument(id: string): Promise<boolean> {
    const result = await db.delete(schema.orderDocuments)
      .where(eq(schema.orderDocuments.id, id));
    return true;
  }

  async getOrderDocuments(orderId: string): Promise<schema.OrderDocument[]> {
    return await db.select().from(schema.orderDocuments)
      .where(eq(schema.orderDocuments.orderId, orderId))
      .orderBy(desc(schema.orderDocuments.createdAt));
  }

  // Transport Notifications
  async createTransportNotification(notification: schema.InsertTransportNotification): Promise<schema.TransportNotification> {
    const [result] = await db.insert(schema.transportNotifications).values(notification).returning();
    return result;
  }

  async getTransportNotifications(userId: string): Promise<schema.TransportNotification[]> {
    return await db.select().from(schema.transportNotifications)
      .where(eq(schema.transportNotifications.userId, userId))
      .orderBy(desc(schema.transportNotifications.createdAt))
      .limit(50);
  }

  async getTransportNotificationsByOrder(orderId: string): Promise<schema.TransportNotification[]> {
    return await db.select().from(schema.transportNotifications)
      .where(eq(schema.transportNotifications.orderId, orderId))
      .orderBy(desc(schema.transportNotifications.createdAt));
  }

  async markTransportNotificationRead(id: string): Promise<schema.TransportNotification | undefined> {
    const [result] = await db.update(schema.transportNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(schema.transportNotifications.id, id))
      .returning();
    return result;
  }

  async markAllTransportNotificationsRead(userId: string): Promise<number> {
    const result = await db.update(schema.transportNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(schema.transportNotifications.userId, userId),
        eq(schema.transportNotifications.isRead, false)
      ));
    return 0;
  }

  async getUnreadTransportNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(schema.transportNotifications)
      .where(and(
        eq(schema.transportNotifications.userId, userId),
        eq(schema.transportNotifications.isRead, false)
      ));
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();
