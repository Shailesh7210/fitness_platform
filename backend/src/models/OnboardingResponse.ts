import mongoose, { Schema, Document } from 'mongoose';

export interface IOnboardingResponse extends Document {
  userId:            mongoose.Types.ObjectId;
  questionnaireId:   mongoose.Types.ObjectId;
  version:           number;
  status:            'in_progress' | 'completed';
  answers:           Record<string, any>;
  currentQuestionId: string;
  completedAt:       Date | null;
  createdAt:         Date;
  updatedAt:         Date;
}

const OnboardingResponseSchema = new Schema<IOnboardingResponse>(
  {
    userId:            { type: Schema.Types.ObjectId, ref: 'User',          required: true },
    questionnaireId:   { type: Schema.Types.ObjectId, ref: 'Questionnaire', required: true },
    version:           { type: Number, required: true },
    status:            {
                         type: String,
                         enum: ['in_progress','completed'],
                         default: 'in_progress'
                       },
    answers:           { type: Schema.Types.Mixed, default: {} },
    currentQuestionId: { type: String, default: '' },
    completedAt:       { type: Date, default: null },
  },
  { timestamps: true }
);

OnboardingResponseSchema.index(
  { userId: 1, questionnaireId: 1 },
  { unique: true }
);

export const OnboardingResponse = mongoose.model<IOnboardingResponse>(
  'OnboardingResponse',
  OnboardingResponseSchema
);