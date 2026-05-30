import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantConfig extends Document {
  branding: {
    appName:       string;
    logoUrl:       string;
    faviconUrl:    string;
    primaryColor:  string;
    accentColor:   string;
    fontFamily:    string;
  };
  labels: {
    challengesSingular: string;
    challengesPlural:   string;
    pointsLabel:        string;
    memberLabel:        string;
  };
  features: {
    leaderboard:  boolean;
    socialFeed:   boolean;
    nutrition:    boolean;
    mindPrograms: boolean;
    deviceSync:   boolean;
    chatbot:      boolean;
    onboarding:   boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantConfigSchema = new Schema<ITenantConfig>(
  {
    branding: {
      appName:      { type: String, default: 'MyPlatform' },
      logoUrl:      { type: String, default: '' },
      faviconUrl:   { type: String, default: '' },
      primaryColor: { type: String, default: '#2563EB' },
      accentColor:  { type: String, default: '#1B2A4A' },
      fontFamily:   { type: String, default: 'Inter' },
    },
    labels: {
      challengesSingular: { type: String, default: 'Challenge' },
      challengesPlural:   { type: String, default: 'Challenges' },
      pointsLabel:        { type: String, default: 'Points' },
      memberLabel:        { type: String, default: 'Member' },
    },
    features: {
      leaderboard:  { type: Boolean, default: true },
      socialFeed:   { type: Boolean, default: true },
      nutrition:    { type: Boolean, default: true },
      mindPrograms: { type: Boolean, default: true },
      deviceSync:   { type: Boolean, default: true },
      chatbot:      { type: Boolean, default: false },
      onboarding:   { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const TenantConfig = mongoose.model<ITenantConfig>(
  'TenantConfig',
  TenantConfigSchema
);