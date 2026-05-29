import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyLog {
  day:                  number;
  completedAt:          Date;
  mood:                 number;
  notes:                string;
  activitiesCompleted:  string[];
}

export interface IProgramEnrollment extends Document {
  userId:      mongoose.Types.ObjectId;
  programId:   mongoose.Types.ObjectId;
  status:      'active' | 'paused' | 'completed' | 'abandoned';
  startDate:   Date;
  currentDay:  number;
  streak:      number;
  dailyLogs:   IDailyLog[];
  createdAt:   Date;
  updatedAt:   Date;
}

const DailyLogSchema = new Schema<IDailyLog>(
  {
    day:                 { type: Number, required: true },
    completedAt:         { type: Date,   default: Date.now },
    mood:                { type: Number, min: 1, max: 5, required: true },
    notes:               { type: String, default: '' },
    activitiesCompleted: [{ type: String }],
  },
  { _id: false }
);

const ProgramEnrollmentSchema = new Schema<IProgramEnrollment>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User',        required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'MindProgram', required: true },
    status:    {
                 type: String,
                 enum: ['active','paused','completed','abandoned'],
                 default: 'active'
               },
    startDate:  { type: Date,   default: Date.now },
    currentDay: { type: Number, default: 1 },
    streak:     { type: Number, default: 0 },
    dailyLogs:  [DailyLogSchema],
  },
  { timestamps: true }
);

ProgramEnrollmentSchema.index(
  { userId: 1, programId: 1 },
  { unique: true }
);

export const ProgramEnrollment = mongoose.model<IProgramEnrollment>(
  'ProgramEnrollment',
  ProgramEnrollmentSchema
);