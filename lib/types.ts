export type WorkPeriod = {
  type: "work" | "break";
  start: string; // e.g. "09:00"
  end: string;   // e.g. "12:00"
};

export type WeeklySchedule = {
  [day: string]: WorkPeriod[];
};

export type ClockScheduleType = {
  hour: number;
  minute: number;
  atm: "AM" | "PM";
};

export type DayScheduleType = {
  hasSchedule: boolean;
  from: ClockScheduleType;
  to: ClockScheduleType;
};

// export interface ChatRoom {
//   clinic_profiles: any;
//   profiles: any;
//   id: string;
//   client1: string;
//   client2: string;
//   created_at: string;
// }

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  client1?: string;  // optional if not always present
  client2?: string;  // optional
  created_at: string;
  last_message_at?: string;  // optional if sometimes missing
  last_read_at_by_current_user?: string;  // optional, ISO timestamp

  profiles: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  } | any;  // fallback to any if you want

  clinic_profiles?: {
    clinic_name?: string;
    clinic_photo_url?: string;
  } | any;
}

export type Dentist = {
  name: string;
  specialty: string;
  weeklySchedule: WeeklySchedule;
};