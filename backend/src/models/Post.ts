import mongoose, { Schema, Document } from 'mongoose';

export interface IReport {
  reportedBy: mongoose.Types.ObjectId;
  reason:     string;
  createdAt:  Date;
}

export interface IAuditEntry {
  action:      string;
  performedBy: mongoose.Types.ObjectId | null;
  reason:      string;
  at:          Date;
}

export interface IPost extends Document {
  authorId:    mongoose.Types.ObjectId;
  body:        string;
  imageUrl:    string;
  status:      'active' | 'pending_review' | 'hidden' | 'rejected';
  reportCount: number;
  reports:     IReport[];
  auditLog:    IAuditEntry[];
  createdAt:   Date;
  updatedAt:   Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason:     { type: String, required: true },
    createdAt:  { type: Date, default: Date.now },
  },
  { _id: false }
);

const AuditSchema = new Schema<IAuditEntry>(
  {
    action:      { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason:      { type: String, default: '' },
    at:          { type: Date, default: Date.now },
  },
  { _id: false }
);

const PostSchema = new Schema<IPost>(
  {
    authorId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body:        { type: String, required: true, maxlength: 2000 },
    imageUrl:    { type: String, default: '' },
    status:      {
                   type: String,
                   enum: ['active','pending_review','hidden','rejected'],
                   default: 'active'
                 },
    reportCount: { type: Number, default: 0 },
    reports:     [ReportSchema],
    auditLog:    [AuditSchema],
  },
  { timestamps: true }
);

PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ authorId: 1, createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);