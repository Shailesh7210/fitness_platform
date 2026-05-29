import mongoose, { Schema, Document } from 'mongoose';

export interface INutritionGoal extends Document {
  userId:         mongoose.Types.ObjectId;
  dailyCalories:  number;
  dailyProtein:   number;
  dailyCarbs:     number;
  dailyFat:       number;
  targetWeight:   number;
  weeklyLossRate: number;
  dietType:       'standard' | 'keto' | 'vegetarian' | 'vegan' | 'paleo';
  createdAt:      Date;
  updatedAt:      Date;
}

const NutritionGoalSchema = new Schema<INutritionGoal>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dailyCalories:  { type: Number, default: 2000 },
    dailyProtein:   { type: Number, default: 50 },
    dailyCarbs:     { type: Number, default: 250 },
    dailyFat:       { type: Number, default: 65 },
    targetWeight:   { type: Number, default: 0 },
    weeklyLossRate: { type: Number, default: 0.5 },
    dietType:       {
                      type: String,
                      enum: ['standard','keto','vegetarian','vegan','paleo'],
                      default: 'standard'
                    },
  },
  { timestamps: true }
);

export const NutritionGoal = mongoose.model<INutritionGoal>(
  'NutritionGoal',
  NutritionGoalSchema
);