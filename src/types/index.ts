// Entity Types
export type Chargeable = {
  id: string;
  name: string;
  description: string | null;
  type: 'MEMBERSHIP_FEE' | 'FLIGHT_HOUR' | 'LANDING_FEE' | 'INSTRUCTION' | 'EQUIPMENT' | 'OTHER' | 'AIRWAYS_FEE';  // ChargeableType enum
  unitPrice: number;
  taxRate: number;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  unitPriceInclTax: number;
};

export type AircraftType = {
  id: string;
  type: string;
  model: string;
  year: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AircraftTechLog = {
  id: string;
  aircraft_id: string;
  booking_id: string | null;
  booking_flight_times_id: string | null;
  current_tacho: number | null;
  current_hobbs: number | null;
  previous_tacho: number | null;
  previous_hobbs: number | null;
  tacho_time: number | null;
  hobbs_time: number | null;
  engine_hours: number | null;
  created_at: string;
  updated_at: string;
};

export type Aircraft = {
  id: string;
  registration: string;
  type_id: string;
  aircraft_type?: AircraftType | null;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  photo_url: string | null;
  record_hobbs: boolean;
  record_tacho: boolean;
  created_at: string;
  updated_at: string;
  tech_log?: AircraftTechLog | null;
};

export type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  membership_type: 'STUDENT' | 'PRIVATE' | 'COMMERCIAL';
  medical_expiry: string;
  created_at: string;
  updated_at: string;
};

export type Staff = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'INSTRUCTOR' | 'ADMIN' | 'MAINTENANCE';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  dueDate: string;
  userId: string;
  organizationId: string;
  bookingId: string | null;
  createdAt: string;
  updatedAt: string;
  invoiceNumber: string | null;
  issuedDate: string;
  notes: string | null;
  paidDate: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  reference: string | null;
  amountPaid: number;
  balanceRemaining: number | null;
  user?: User;
  items?: InvoiceItem[];
  booking?: Booking;
};

export type InvoiceItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  total: number;
  description: string | null;
  invoiceId: string;
  chargeableId: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  subTotal: number | null;
  chargeable?: Chargeable;
};

export type Payment = {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  status: string;
  processedAt: Date | null;
  createdAt: Date;
};

// Common Types
export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type SortingParams = {
  column: string;
  direction: 'asc' | 'desc';
};

// API Response Types
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export type PaginatedResponse<T> = ApiResponse<T> & {
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  password: string;
  role: 'MEMBER' | 'ADMIN' | 'INSTRUCTOR';  // UserRole enum
  organizationId: string;
  memberStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';  // MembershipStatus enum
  createdAt: string;
  updatedAt: string;
  address: string | null;
  birthDate: string | null;
  gender: string | null;
  isStaff: boolean | null;
  joinDate: string | null;
  lastFlight: string | null;
  memberNumber: string | null;
  phone: string | null;
  photo_url: string | null;
};

export type UserDetails = {
  id: string;
  email: string;
  name: string | null;
  role: 'MEMBER' | 'ADMIN' | 'INSTRUCTOR';
  memberStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  organizationId: string;
  phone: string | null;
  photo_url: string | null;
  birthDate: string | null;
  joinDate: string | null;
  lastFlight: string | null;
  memberNumber: string | null;
  isStaff: boolean | null;
  gender: string | null;
  address: string | null;
};

export type BookingStatus = 'unconfirmed' | 'confirmed' | 'flying' | 'inProgress' | 'complete' | 'cancelled';
export type BookingType = 'groundwork' | 'flight' | 'maintenance' | 'timesheet';

export type BookingDetails = {
  id: string;
  route: string | null;
  comments: string | null;
  instructor_comment: string | null;
  passengers: string | null;
  eta: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingFlightTimes = {
  id: string;
  start_hobbs: number | null;
  end_hobbs: number | null;
  start_tacho: number | null;
  end_tacho: number | null;
  flight_time: number | null;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: string;
  name: string;
  description: string | null;
  duration: number | null;
  created_at: string | null;
  updated_at: string | null;
  briefing_url: string | null;
  air_exercise: any[] | null;  // JSONB type
  prerequisites: any[] | null;  // JSONB type
  objective: any | null;  // JSONB type
};

export type StudentLesson = {
  id: string;
  student_id: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  lesson_id: string;
  lesson?: Lesson | null;
};

export type Booking = {
  id: string;
  aircraft_id: string | null;
  instructor_id: string | null;
  user_id: string | null;
  organization_id: string;
  type: BookingType;
  status: BookingStatus;
  description: string | null;
  flight_type_id: string | null;
  lesson_id: string | null;
  booking_flight_times_id: string | null;
  booking_details_id: string | null;
  briefing_completed: boolean | null;
  startTime: string;
  endTime: string;
  created_at: string;
  updated_at: string;
  aircraft?: Aircraft | null;
  instructor?: {
    id: string;
    name: string;
    email: string;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  booking_details?: BookingDetails | null;
  flight_times?: BookingFlightTimes | null;
  lesson?: Lesson | null;
};

export type LessonGrading = {
  id: string;
  name: string;
  description: string | null;
  lesson_id: string;
  organizationId: string;
  created_at: string;
  updated_at: string;
};

export type DebriefPerformanceJSON = {
  grading_id: string;
  grade: number;
  comments: string | null;
  name: string;  // from lesson_gradings
  description: string | null;  // from lesson_gradings
};

export type LessonDebrief = {
  id: string;
  booking_id: string;
  created_at: string;
  updated_at: string;
  performances_json: DebriefPerformanceJSON[] | null;
  lesson_status: 'PASS' | 'FAIL' | 'INCOMPLETE';
  overall_comments: string | null;
  booking?: Booking;
  performances?: LessonDebriefPerformance[];
};

export type LessonDebriefPerformance = {
  id: string;
  lesson_debrief_id: string;
  description: string;
  grade: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
}; 