// ==========================================================================
// SQLite Database Layer (via sql.js)
// Enforces UNIQUE(date, time) constraint on appointments table
// ==========================================================================

import initSqlJs from 'sql.js';
import type { Appointment } from './types.ts';

type SqlDatabase = any;
type SqlJsStatic = any;

let SQLPromise: Promise<SqlJsStatic> | null = null;
let dbInstance: SqlDatabase | null = null;

function getSQL(): Promise<SqlJsStatic> {
  if (!SQLPromise) {
    const isBrowser = typeof window !== 'undefined';
    SQLPromise = initSqlJs(
      isBrowser ? { locateFile: () => '/sql-wasm.wasm' } : {}
    );
  }
  return SQLPromise!;
}

export async function getDatabase(): Promise<SqlDatabase> {
  if (dbInstance) return dbInstance;

  const SQL = await getSQL();
  dbInstance = new SQL.Database();

  // Create table with unique index on date+time
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      businessId TEXT,
      callerName TEXT,
      callerPhone TEXT,
      service TEXT,
      date TEXT,
      time TEXT,
      duration INTEGER,
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      createdBy TEXT,
      UNIQUE(date, time)
    );
  `);

  return dbInstance;
}

const localAppointments = new Map<string, Appointment>();

export async function clearDatabase(): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM appointments;');
  localAppointments.clear();
}

export async function isSlotTaken(date: string, time: string): Promise<boolean> {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT 1 FROM appointments WHERE date = :date AND time = :time AND status != "cancelled"');
  stmt.bind({ ':date': date, ':time': time });
  const hasRow = stmt.step();
  stmt.free();
  return hasRow;
}

export async function getFreeSlots(date: string): Promise<string[]> {
  const standardSlots = ['10:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'];
  const freeSlots: string[] = [];

  for (const slot of standardSlots) {
    const time24 = to24Hour(slot);
    const taken = await isSlotTaken(date, time24);
    if (!taken) {
      freeSlots.push(slot);
    }
  }

  return freeSlots;
}

export function to24Hour(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return timeStr;

  let hr = parseInt(match[1], 10);
  const min = match[2];
  const ampm = match[3]?.toLowerCase();

  if (ampm === 'pm' && hr < 12) hr += 12;
  if (ampm === 'am' && hr === 12) hr = 0;

  return `${hr.toString().padStart(2, '0')}:${min}`;
}

export function to12Hour(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;

  let hr = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hr >= 12 ? 'PM' : 'AM';

  if (hr === 0) hr = 12;
  else if (hr > 12) hr -= 12;

  return `${hr}:${min} ${ampm}`;
}

export async function insertAppointment(apt: Appointment): Promise<{ success: boolean; error?: string; isConflict?: boolean }> {
  const db = await getDatabase();
  const time24 = to24Hour(apt.time);

  // Check unique index before inserting
  const taken = await isSlotTaken(apt.date, time24);
  if (taken) {
    return {
      success: false,
      error: `The slot on ${apt.date} at ${to12Hour(time24)} is already booked.`,
      isConflict: true,
    };
  }

  try {
    db.run(
      `INSERT INTO appointments (
        id, businessId, callerName, callerPhone, service, date, time, duration, status, notes, createdAt, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        apt.id,
        apt.businessId,
        apt.callerName,
        apt.callerPhone,
        apt.service,
        apt.date,
        time24,
        apt.duration,
        apt.status,
        apt.notes || '',
        apt.createdAt,
        apt.createdBy,
      ]
    );

    localAppointments.set(apt.id, { ...apt, time: time24 });
    return { success: true };
  } catch (err: any) {
    const isConflict = err?.message?.includes('UNIQUE constraint failed');
    return {
      success: false,
      error: isConflict ? `Slot already taken: ${apt.date} at ${to12Hour(time24)}` : err?.message,
      isConflict,
    };
  }
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM appointments ORDER BY date, time');
  const results: Appointment[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push({
      id: row.id,
      businessId: row.businessId,
      callerName: row.callerName,
      callerPhone: row.callerPhone,
      service: row.service,
      date: row.date,
      time: row.time,
      duration: row.duration,
      status: row.status,
      notes: row.notes,
      createdAt: row.createdAt,
      createdBy: row.createdBy,
    });
  }
  stmt.free();
  return results;
}
