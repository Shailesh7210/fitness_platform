import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role:      'user' | 'assistant';
  content:   string;
  flagged:   boolean;
  createdAt: Date;
}

export interface IChatSession extends Document {
  userId:    mongoose.Types.ObjectId;
  messages:  IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role:      { type: String, enum: ['user','assistant'], required: true },
    content:   { type: String, required: true },
    flagged:   { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model<IChatSession>(
  'ChatSession',
  ChatSessionSchema
);