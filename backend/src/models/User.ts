import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName:    string;
  lastName:     string;
  email:        string;
  passwordHash: string;
  role:         'member' | 'admin';
  isActive:     boolean;
  lastLoginAt:  Date | null;
  createdAt:    Date;
  updatedAt:    Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    email:       {
                   type: String, required: true,
                   unique: true, lowercase: true, trim: true
                 },
    passwordHash:{ type: String, required: true },
    role:        {
                   type: String,
                   enum: ['member', 'admin'],
                   default: 'member'
                 },
    isActive:    { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);