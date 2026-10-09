export type UserRole = 
  | 'STUDENT'
  | 'FACULTY'
  | 'TEACHER'
  | 'TA'
  | 'HEAD'
  | 'ESTATE'
  | 'NON_FACULTY'
  | 'CO_FOUNDER'
  | 'IT_MANAGER';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  subject?: string | null;
  schoolClass?: string;
}

export interface SchoolTest {
  id: string | number;
  title: string;
  subject: string;
  schoolClass: string;
  room: string;
  date: string;
  start: string;
  end: string;
  startsAt: string;
  endsAt: string;
  createdBy?: string;
  createdAt?: string;
}

export interface Announcement {
  id: string | number;
  body: string;
  authorName: string;
  authorRole: UserRole | string;
  createdAt: string;
  expiresAt: string;
  authorUserId?: string;
  authorUid?: string;
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string;
  imageCaption?: string;
}

export interface FacultyMember {
  name: string;
  area: string;
  role: UserRole;
}

export type AuditEventType = 
  | 'SIGN_IN_SUCCESS'
  | 'SIGN_IN_RESTRICTED'
  | 'SIGN_OUT'
  | 'STUDENT_ACCOUNT_CREATED'
  | 'ANNOUNCEMENT_POSTED'
  | 'TEST_SCHEDULED';

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  status: 'SUCCESS' | 'RESTRICTED' | 'WARNING';
  email: string;
  name: string;
  role: UserRole | string;
  schoolClass?: string;
  reason?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface StudentAccountRecord {
  id?: string;
  userId: string;
  email: string;
  name: string;
  role: 'STUDENT';
  schoolClass: string;
  createdAt: string;
  verifiedBy: string;
  emailVerified: boolean;
}
