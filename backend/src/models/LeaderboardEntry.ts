import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboardEntry extends Document {
  challengeId: mongoose.Types.ObjectId;
  userId:      mongoose.Types.ObjectId;
  score:       number;
  rank:        number;
  updatedAt:   Date;
}

const LeaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    challengeId: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true },
    userId:      { type: Schema.Types.ObjectId, ref: 'User',      required: true },
    score:       { type: Number, default: 0 },
    rank:        { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One entry per user per challenge
LeaderboardEntrySchema.index({ challengeId: 1, userId: 1 }, { unique: true });

// Sort by score fast
LeaderboardEntrySchema.index({ challengeId: 1, score: -1 });

export const LeaderboardEntry = mongoose.model<ILeaderboardEntry>(
  'LeaderboardEntry',
  LeaderboardEntrySchema
);