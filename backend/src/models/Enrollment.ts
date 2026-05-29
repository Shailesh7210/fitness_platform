import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  userId:      mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  status:      'active' | 'completed' | 'dropped';
  progress:    number;
  joinedAt:    Date;
  createdAt:   Date;
  updatedAt:   Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User',      required: true },
    challengeId: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true },
    status:      {
                   type: String,
                   enum: ['active','completed','dropped'],
                   default: 'active'
                 },
    progress:    { type: Number, default: 0 },
    joinedAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One user can only enroll once per challenge
EnrollmentSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);