import mongoose, { Schema, Document } from 'mongoose';

export interface IMealLog extends Document {
  userId:       mongoose.Types.ObjectId;
  date:         Date;
  mealType:     'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName:     string;
  calories:     number;
  protein:      number;
  carbs:        number;
  fat:          number;
  quantity:     number;
  unit:         string;
  notes:        string;
  createdAt:    Date;
}

const MealLogSchema = new Schema<IMealLog>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date:     { type: Date, required: true },
    mealType: {
                type: String,
                enum: ['breakfast','lunch','dinner','snack'],
                required: true
              },
    foodName: { type: String, required: true, trim: true },
    calories: { type: Number, required: true, min: 0 },
    protein:  { type: Number, default: 0, min: 0 },
    carbs:    { type: Number, default: 0, min: 0 },
    fat:      { type: Number, default: 0, min: 0 },
    quantity: { type: Number, default: 1, min: 0 },
    unit:     { type: String, default: 'serving' },
    notes:    { type: String, default: '' },
  },
  { timestamps: true }
);

MealLogSchema.index({ userId: 1, date: -1 });

export const MealLog = mongoose.model<IMealLog>('MealLog', MealLogSchema);