import fs from 'fs';
import path from 'path';
import {
  Schedule,
  Appointment,
  AppointmentParticipantWithProfile,
  Category,
  Profile,
} from '@/types/database.types';
import {
  MOCK_SCHEDULES,
  MOCK_APPOINTMENTS,
  MOCK_PARTICIPANTS,
  MOCK_CATEGORIES,
  MOCK_PROFILES,
} from '@/lib/mock-data';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

export interface ServerDatabase {
  schedules: Schedule[];
  appointments: Appointment[];
  participants: AppointmentParticipantWithProfile[];
  categories: Category[];
  profiles: Profile[];
  notifications: any[];
}

function getDefaultDatabase(): ServerDatabase {
  return {
    schedules: MOCK_SCHEDULES,
    appointments: MOCK_APPOINTMENTS,
    participants: MOCK_PARTICIPANTS,
    categories: MOCK_CATEGORIES,
    profiles: MOCK_PROFILES,
    notifications: [],
  };
}

export function readDatabase(): ServerDatabase {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getDefaultDatabase();
      writeDatabase(initial);
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    if (!raw.trim()) {
      const initial = getDefaultDatabase();
      writeDatabase(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading server database file, resetting to defaults:', error);
    const initial = getDefaultDatabase();
    writeDatabase(initial);
    return initial;
  }
}

export function writeDatabase(data: ServerDatabase): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to server database file:', error);
  }
}
