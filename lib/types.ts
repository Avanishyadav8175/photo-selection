import { ObjectId } from 'mongodb';

export interface Admin {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin';
  createdAt: Date;
}

export interface Folder {
  _id?: ObjectId;
  name: string;
  gcsPrefix: string;
  thumbnailPrefix: string;
  createdBy: ObjectId;
  createdAt: Date;
  sizeBytes: number;
  status: 'active' | 'expired' | 'archived' | 'deleted';
  deletedAt?: Date;
}

export interface Image {
  _id?: ObjectId;
  folderId: ObjectId;
  filename: string;
  gcsPath: string;
  thumbPath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  status?: 'active' | 'deleted';
  deletedAt?: Date;
}

export interface OTP {
  _id?: ObjectId;
  folderId: ObjectId;
  otpHash: string;
  expiresAt: Date;
  createdAt: Date;
  createdBy: ObjectId;
}

export interface Client {
  _id?: ObjectId;
  folderId: ObjectId;
  name: string;
  phone: string;
  token: string;
  createdAt: Date;
  downloadGranted: boolean;
  downloadGrantedAt?: Date;
}

export interface Selection {
  _id?: ObjectId;
  clientId: ObjectId;
  imageId: ObjectId;
  selectedAt: Date;
}

export interface DownloadLog {
  _id?: ObjectId;
  clientId: ObjectId;
  folderId: ObjectId;
  imageId: ObjectId;
  signedUrlUsed: boolean;
  downloadAt: Date;
  ip: string;
  userAgent: string;
}

// Booking Management Types
export interface BookingEvent {
  name: string;
  date: string;
  time: 'Day' | 'Night';
  services: string[]; // ['Photo', 'Video', 'Drone']
  team: string[];
}

export interface Payment {
  id: number;
  amount: number;
  date: string;
  mode: string;
  note: string;
}

export interface Expense {
  id: number;
  desc: string;
  amount: number;
}

export interface Booking {
  _id?: ObjectId;
  id: number;
  name: string;
  mobile: string;
  whatsapp?: string;
  customerAddress?: string;
  venueAddress?: string;
  eventType: string;
  mainEventDate: string;
  events: BookingEvent[];
  total: number;
  due: number;
  note?: string;
  payments: Payment[];
  expenses: Expense[];
  createdAt: Date;
  status: 'active' | 'deleted';
}

export interface ManpowerRates {
  tilak?: number;
  haldi?: number;
  wedding?: number;
  engagement?: number;
  birthday?: number;
  mundan?: number;
}

export interface Manpower {
  _id?: ObjectId;
  id: number;
  name: string;
  whatsapp?: string;
  specialty: string;
  rates: ManpowerRates;
  createdAt: Date;
  status: 'active' | 'deleted';
}
