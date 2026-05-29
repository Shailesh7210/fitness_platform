import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity {
  title:       string;
  type:        'meditation' | 'breathing' | 'journaling' | 'reading' | 'exercise';
  durationMin: number;
  description: string;
  contentUrl:  string;
}

export interface IProgramDay {
  dayNumber:  number;
  title:      string;
  activities: IActivity[];
}

export interface IMindProgram extends Document {
  title:        string;
  description:  string;
  category:     'meditation' | 'sleep' | 'stress' | 'focus' | 'resilience';
  durationDays: number;
  difficulty:   'beginner' | 'intermediate' | 'advanced';
  imageUrl:     string;
  isPublished:  boolean;
  days:         IProgramDay[];
  createdBy:    mongoose.Types.ObjectId;
  createdAt:    Date;
  updatedAt:    Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    title:       { type: String, required: true },
    type:        {
                   type: String,
                   enum: ['meditation','breathing','journaling','reading','exercise'],
                   required: true
                 },
    durationMin: { type: Number, required: true },
    description: { type: String, default: '' },
    contentUrl:  { type: String, default: '' },
  },
  { _id: false }
);

const ProgramDaySchema = new Schema<IProgramDay>(
  {
    dayNumber:  { type: Number, required: true },
    title:      { type: String, required: true },
    activities: [ActivitySchema],
  },
  { _id: false }
);

const MindProgramSchema = new Schema<IMindProgram>(
  {
    title:        { type: String, required: true, trim: true },
    description:  { type: String, required: true },
    category:     {
                    type: String,
                    enum: ['meditation','sleep','stress','focus','resilience'],
                    required: true
                  },
    durationDays: { type: Number, required: true },
    difficulty:   {
                    type: String,
                    enum: ['beginner','intermediate','advanced'],
                    default: 'beginner'
                  },
    imageUrl:     { type: String, default: '' },
    isPublished:  { type: Boolean, default: false },
    days:         [ProgramDaySchema],
    createdBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const MindProgram = mongoose.model<IMindProgram>(
  'MindProgram',
  MindProgramSchema
);