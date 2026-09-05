import fs from 'fs';
import path from 'path';
import {
  Schedule,
  Appointment,
  AppointmentParticipantWithProfile,
  Category,
  Profile,
  Invitation,
} from '@/types/database.types';
import {
  MOCK_SCHEDULES,
  MOCK_APPOINTMENTS,
  MOCK_PARTICIPANTS,
  MOCK_CATEGORIES,
  MOCK_PROFILES,
  MOCK_INVITATIONS,
} from '@/lib/mock-data';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

export interface ServerDatabase {
  schedules: Schedule[];
  appointments: Appointment[];
  participants: AppointmentParticipantWithProfile[];
  categories: Category[];
  profiles: Profile[];
  invitations: Invitation[];
  notifications: any[];
}

function getDefaultDatabase(): ServerDatabase {
  return {
    schedules: MOCK_SCHEDULES,
    appointments: MOCK_APPOINTMENTS,
    participants: MOCK_PARTICIPANTS,
    categories: MOCK_CATEGORIES,
    profiles: MOCK_PROFILES,
    invitations: MOCK_INVITATIONS,
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
    const parsed = JSON.parse(raw);
    if (!parsed.profiles || !Array.isArray(parsed.profiles)) {
      parsed.profiles = MOCK_PROFILES;
    } else {
      // Merge any new mock profiles into parsed profiles if missing
      for (const mp of MOCK_PROFILES) {
        if (!parsed.profiles.some((p: any) => p.email.toLowerCase() === mp.email.toLowerCase())) {
          parsed.profiles.push(mp);
        }
      }
    }
    if (!parsed.invitations) {
      parsed.invitations = MOCK_INVITATIONS;
    }
    return parsed;
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
