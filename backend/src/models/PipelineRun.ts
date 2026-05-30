import mongoose, { Schema, Document } from 'mongoose';

export interface IStageResult {
  stage:     string;
  status:    'pending' | 'running' | 'completed' | 'failed';
  records:   number;
  error:     string;
  startedAt: Date | null;
  doneAt:    Date | null;
}

export interface IPipelineRun extends Document {
  date:       string;
  status:     'pending' | 'running' | 'completed' | 'failed';
  stages:     IStageResult[];
  startedAt:  Date | null;
  doneAt:     Date | null;
  triggeredBy: 'scheduler' | 'manual' | 'backfill';
  createdAt:  Date;
}

const StageResultSchema = new Schema<IStageResult>(
  {
    stage:     { type: String, required: true },
    status:    {
                 type: String,
                 enum: ['pending','running','completed','failed'],
                 default: 'pending'
               },
    records:   { type: Number, default: 0 },
    error:     { type: String, default: '' },
    startedAt: { type: Date, default: null },
    doneAt:    { type: Date, default: null },
  },
  { _id: false }
);

const PipelineRunSchema = new Schema<IPipelineRun>(
  {
    date:        { type: String, required: true },
    status:      {
                   type: String,
                   enum: ['pending','running','completed','failed'],
                   default: 'pending'
                 },
    stages:      [StageResultSchema],
    startedAt:   { type: Date, default: null },
    doneAt:      { type: Date, default: null },
    triggeredBy: {
                   type: String,
                   enum: ['scheduler','manual','backfill'],
                   default: 'manual'
                 },
  },
  { timestamps: true }
);

PipelineRunSchema.index({ date: 1 }, { unique: true });

export const PipelineRun = mongoose.model<IPipelineRun>(
  'PipelineRun',
  PipelineRunSchema
);