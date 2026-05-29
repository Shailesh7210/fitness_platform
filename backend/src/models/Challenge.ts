import mongoose, { Schema, Document } from 'mongoose';

export interface IChallenge extends Document {
  title:          string;
  description:    string;
  type:           'steps' | 'nutrition' | 'mindfulness' | 'weight_loss' | 'custom';
  status:         'draft' | 'published' | 'paused' | 'archived';
  startDate:      Date;
  endDate:        Date;
  goal:           { target: number; unit: string; };
  rules:          string;
  imageUrl:       string;
  enrolledCount:  number;
  createdBy:      mongoose.Types.ObjectId;
  createdAt:      Date;
  updatedAt:      Date;
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type:        {
                   type: String,
                   enum: ['steps','nutrition','mindfulness','weight_loss','custom'],
                   required: true
                 },
    status:      {
                   type: String,
                   enum: ['draft','published','paused','archived'],
                   default: 'draft'
                 },
    startDate:   { type: Date, required: true },
    endDate:     { type: Date, required: true },
    goal:        {
                   target: { type: Number, required: true },
                   unit:   { type: String, required: true },
                 },
    rules:          { type: String, default: '' },
    imageUrl:       { type: String, default: '' },
    enrolledCount:  { type: Number, default: 0 },
    createdBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema);