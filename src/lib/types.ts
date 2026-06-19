// Shared types for the school attendance system

export type Role = "PRINCIPAL" | "TEACHER";

export interface School {
  id: string;
  code: string;
  name: string;
  pin: string;
  levelsJson: string;
  createdAt: string;
}

export interface Teacher {
  id: string;
  code: string;
  name: string;
  pin: string;
  role: Role;
  schoolId: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  civilId: string;
  phone: string;
  grade: string;
  section: string;
  schoolId: string;
  createdAt: string;
}

export interface LateRecord {
  id: string;
  studentId: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  student?: Student;
  createdAt: string;
}

export interface AbsenceRecord {
  id: string;
  studentId: string;
  schoolId: string;
  date: string;
  student?: Student;
  createdAt: string;
}

export interface Note {
  id: string;
  studentId: string;
  schoolId: string;
  date: string;
  content: string;
  student?: Student;
  createdAt: string;
}

export interface Permission {
  id: string;
  studentId: string;
  schoolId: string;
  date: string;
  time: string;
  reason: string;
  guardianName: string;
  student?: Student;
  createdAt: string;
}

export interface Excuse {
  id: string;
  schoolId: string;
  studentName: string;
  grade: string;
  absenceDate: string;
  daysCount: number;
  reason: string;
  attachment: string | null;
  status: "PENDING" | "REVIEWED";
  createdAt: string;
}

export interface AbsenceLevel {
  level: number;
  name: string;
  minDays: number;
  maxDays: number;
  color: "green" | "yellow" | "orange" | "red";
}

export interface Session {
  schoolCode: string;
  schoolName: string;
  schoolId: string;
  teacherCode: string;
  teacherName: string;
  role: Role;
}

export interface DashboardStats {
  totalStudents: number;
  todayLate: number;
  todayAbsence: number;
  todayNotes: number;
  todayPermissions: number;
  pendingExcuses: number;
  attendanceRate: number;
  absenceRate: number;
  lateRate: number;
}

export type SectionType =
  | "home"
  | "students"
  | "attendance"
  | "notes"
  | "permissions"
  | "excuses"
  | "analytics"
  | "reports"
  | "settings";
