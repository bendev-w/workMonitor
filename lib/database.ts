import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "work_monitor.db";

// Initialize database and get connection
export async function getDatabase() {
  return await SQLite.openDatabaseAsync(DATABASE_NAME);
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    const db = await getDatabase();

    // Create work_sessions table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS work_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER DEFAULT 0,
        task_id INTEGER,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create tasks table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        category TEXT,
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create daily_stats table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL UNIQUE,
        total_hours REAL DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        focus_time INTEGER DEFAULT 0,
        break_time INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create app_settings table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        setting_key TEXT NOT NULL UNIQUE,
        setting_value TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create orders table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        product_description TEXT,
        quantity INTEGER DEFAULT 1,
        hours_per_item REAL,
        estimated_total_hours REAL,
        start_date INTEGER,
        deadline INTEGER,
        completion_date INTEGER,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'unpaid',
        notes TEXT,
        color TEXT,
        size TEXT,
        material TEXT,
        priority TEXT DEFAULT 'medium',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create user_settings table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        hours_per_day REAL DEFAULT 8,
        workdays TEXT DEFAULT '1,2,3,4,5',
        reminder_frequency TEXT DEFAULT 'daily',
        theme TEXT DEFAULT 'light',
        notifications_enabled INTEGER DEFAULT 1,
        auto_track_enabled INTEGER DEFAULT 0,
        break_interval INTEGER DEFAULT 25,
        break_duration INTEGER DEFAULT 5,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);


    console.log("Database initialized successfully");
    return db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

// Database Operations
export const db = {
  // Work Sessions
  async addWorkSession(userId: string, startTime: number, notes?: string) {
    const database = await getDatabase();
    const now = Date.now();
    const result = await database.runAsync(
      `INSERT INTO work_sessions (user_id, start_time, created_at, updated_at, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, startTime, now, now, notes || null]
    );
    return result.lastInsertRowId;
  },

  async endWorkSession(sessionId: number) {
    const database = await getDatabase();
    const now = Date.now();
    const endTime = now;
    const session = await database.getFirstAsync<{ start_time: number }>(`SELECT start_time FROM work_sessions WHERE id = ?`, [sessionId]);

    if (!session) throw new Error("Session not found");

    const duration = Math.floor((endTime - session.start_time) / 1000 / 60); // in minutes

    await database.runAsync(`UPDATE work_sessions SET end_time = ?, duration = ?, updated_at = ? WHERE id = ?`, [endTime, duration, now, sessionId]);

    return duration;
  },

  async getActiveSessions(userId: string) {
    const database = await getDatabase();
    return await database.getAllAsync(
      `SELECT * FROM work_sessions WHERE user_id = ? AND end_time IS NULL ORDER BY start_time DESC`,
      [userId]
    );
  },

  async getUserSessions(userId: string, limit = 50) {
    const database = await getDatabase();
    return await database.getAllAsync(
      `SELECT * FROM work_sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT ?`,
      [userId, limit]
    );
  },

  // Tasks
  async addTask(userId: string, name: string, description?: string, category?: string) {
    const database = await getDatabase();
    const now = Date.now();
    const result = await database.runAsync(
      `INSERT INTO tasks (user_id, name, description, category, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
      [userId, name, description || null, category || null, now, now]
    );
    return result.lastInsertRowId;
  },

  async completeTask(taskId: number) {
    const database = await getDatabase();
    const now = Date.now();
    await database.runAsync(
      `UPDATE tasks SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, taskId]
    );
  },

  async getUserTasks(userId: string, status?: string) {
    const database = await getDatabase();
    let query = `SELECT * FROM tasks WHERE user_id = ?`;
    const params: any[] = [userId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;
    return await database.getAllAsync(query, params);
  },

  // Daily Stats
  async updateDailyStats(userId: string, date: string, stats: { total_hours?: number; tasks_completed?: number; focus_time?: number; break_time?: number }) {
    const database = await getDatabase();
    const now = Date.now();

    const existing = await database.getFirstAsync<{ id: number }>(`SELECT id FROM daily_stats WHERE user_id = ? AND date = ?`, [userId, date]);

    if (existing) {
      const updates = Object.entries(stats)
        .map(([key]) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(stats), now, userId, date];
      await database.runAsync(`UPDATE daily_stats SET ${updates}, updated_at = ? WHERE user_id = ? AND date = ?`, values);
    } else {
      const columns = ["user_id", "date", "created_at", "updated_at", ...Object.keys(stats)];
      const placeholders = columns.map(() => "?").join(", ");
      const values = [userId, date, now, now, ...Object.values(stats)];
      await database.runAsync(`INSERT INTO daily_stats (${columns.join(", ")}) VALUES (${placeholders})`, values);
    }
  },

  async getDailyStats(userId: string, date: string) {
    const database = await getDatabase();
    return await database.getFirstAsync(`SELECT * FROM daily_stats WHERE user_id = ? AND date = ?`, [userId, date]);
  },

  async getUserStatsRange(userId: string, startDate: string, endDate: string) {
    const database = await getDatabase();
    return await database.getAllAsync(`SELECT * FROM daily_stats WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC`, [userId, startDate, endDate]);
  },

  // Settings
  async setSetting(userId: string, key: string, value: string) {
    const database = await getDatabase();
    const now = Date.now();

    const existing = await database.getFirstAsync<{ id: number }>(`SELECT id FROM app_settings WHERE user_id = ? AND setting_key = ?`, [userId, key]);

    if (existing) {
      await database.runAsync(`UPDATE app_settings SET setting_value = ?, updated_at = ? WHERE user_id = ? AND setting_key = ?`, [value, now, userId, key]);
    } else {
      await database.runAsync(`INSERT INTO app_settings (user_id, setting_key, setting_value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`, [userId, key, value, now, now]);
    }
  },

  async getSetting(userId: string, key: string) {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{ setting_value: string }>(`SELECT setting_value FROM app_settings WHERE user_id = ? AND setting_key = ?`, [userId, key]);
    return result?.setting_value || null;
  },

  // Orders Operations
  async createOrder(userId: string, order: { product_name: string; product_description?: string; quantity: number; hours_per_item?: number; start_date?: number; deadline?: number; notes?: string; color?: string; size?: string; material?: string; priority?: string }) {
    const database = await getDatabase();
    const now = Date.now();
    const estimated_total_hours = (order.hours_per_item || 0) * order.quantity;

    const result = await database.runAsync(
      `INSERT INTO orders (user_id, product_name, product_description, quantity, hours_per_item, estimated_total_hours, start_date, deadline, notes, color, size, material, priority, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [userId, order.product_name, order.product_description || null, order.quantity, order.hours_per_item || null, estimated_total_hours, order.start_date || null, order.deadline || null, order.notes || null, order.color || null, order.size || null, order.material || null, order.priority || "medium", now, now]
    );
    return result.lastInsertRowId;
  },

  async updateOrder(orderId: number, updates: Record<string, any>) {
    const database = await getDatabase();
    const now = Date.now();
    const columns = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), now, orderId];
    await database.runAsync(`UPDATE orders SET ${columns}, updated_at = ? WHERE id = ?`, values);
  },

  async getOrder(orderId: number) {
    const database = await getDatabase();
    return await database.getFirstAsync(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  },

  async getUserOrders(userId: string, status?: string) {
    const database = await getDatabase();
    let query = `SELECT * FROM orders WHERE user_id = ?`;
    const params: any[] = [userId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY deadline ASC, created_at DESC`;
    return await database.getAllAsync(query, params);
  },

  async deleteOrder(orderId: number) {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM orders WHERE id = ?`, [orderId]);
  },

  async getOrderStats(userId: string) {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{ total_orders: number; completed: number; pending: number; total_hours: number }>(
      `SELECT COUNT(*) as total_orders, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed, 
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending, SUM(estimated_total_hours) as total_hours 
       FROM orders WHERE user_id = ?`,
      [userId]
    );
    return result || { total_orders: 0, completed: 0, pending: 0, total_hours: 0 };
  },

  // User Settings Operations
  async initializeUserSettings(userId: string) {
    const database = await getDatabase();
    const now = Date.now();

    const existing = await database.getFirstAsync(`SELECT id FROM user_settings WHERE user_id = ?`, [userId]);
    if (!existing) {
      await database.runAsync(
        `INSERT INTO user_settings (user_id, hours_per_day, workdays, reminder_frequency, theme, notifications_enabled, auto_track_enabled, break_interval, break_duration, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, 8, "1,2,3,4,5", "daily", "light", 1, 0, 25, 5, now, now]
      );
    }
  },

  async getUserSettings(userId: string) {
    const database = await getDatabase();
    const settings = await database.getFirstAsync(`SELECT * FROM user_settings WHERE user_id = ?`, [userId]);
    if (!settings) {
      await db.initializeUserSettings(userId);
      return await database.getFirstAsync(`SELECT * FROM user_settings WHERE user_id = ?`, [userId]);
    }
    return settings;
  },

  async updateUserSettings(userId: string, updates: Record<string, any>) {
    const database = await getDatabase();
    const now = Date.now();
    const columns = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), now, userId];
    await database.runAsync(`UPDATE user_settings SET ${columns}, updated_at = ? WHERE user_id = ?`, values);
  },

  // Clear all data (use with caution)
  async clearAllData() {
    const database = await getDatabase();
    await database.execAsync(`DELETE FROM work_sessions; DELETE FROM tasks; DELETE FROM daily_stats; DELETE FROM app_settings; DELETE FROM orders; DELETE FROM user_settings;`);
  },
};
