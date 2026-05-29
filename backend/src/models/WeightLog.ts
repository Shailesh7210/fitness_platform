import mongoose, { Schema, Document } from 'mongoose';

export interface IWeightLog extends Document {
  userId:    mongoose.Types.ObjectId;
  weight:    number;
  unit:      'kg' | 'lbs';
  date:      Date;
  notes:     string;
  createdAt: Date;
}

const WeightLogSchema = new Schema<IWeightLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weight: { type: Number, required: true, min: 0 },
    unit:   { type: String, enum: ['kg','lbs'], default: 'kg' },
    date:   { type: Date, required: true },
    notes:  { type: String, default: '' },
  },
  { timestamps: true }
);

WeightLogSchema.index({ userId: 1, date: -1 });

export const WeightLog = mongoose.model<IWeightLog>('WeightLog', WeightLogSchema);