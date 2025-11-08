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
  status: 'active' | 'expired' | 'archived';
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
