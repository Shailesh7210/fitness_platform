import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceIntegration extends Document {
  userId:       mongoose.Types.ObjectId;
  platform:     'fitbit' | 'garmin' | 'apple_health' | 'google_fit' | 'whoop';
  status:       'connected' | 'disconnected' | 'error' | 'syncing';
  accessToken:  string;
  lastSyncAt:   Date | null;
  lastSyncStatus: string;
  errorMessage: string;
  retryCount:   number;
  createdAt:    Date;
  updatedAt:    Date;
}

const DeviceIntegrationSchema = new Schema<IDeviceIntegration>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    platform: {
                type: String,
                enum: ['fitbit','garmin','apple_health','google_fit','whoop'],
                required: true
              },
    status:   {
                type: String,
                enum: ['connected','disconnected','error','syncing'],
                default: 'disconnected'
              },
    accessToken:    { type: String, default: '' },
    lastSyncAt:     { type: Date,   default: null },
    lastSyncStatus: { type: String, default: '' },
    errorMessage:   { type: String, default: '' },
    retryCount:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

DeviceIntegrationSchema.index(
  { userId: 1, platform: 1 },
  { unique: true }
);

export const DeviceIntegration = mongoose.model<IDeviceIntegration>(
  'DeviceIntegration',
  DeviceIntegrationSchema
);