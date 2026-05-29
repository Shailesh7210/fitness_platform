import mongoose, { Schema, Document } from 'mongoose';

export interface IOption {
  value: string;
  label: string;
}

export interface IQuestion {
  id:             string;
  type:           'text' | 'single' | 'multi' | 'number' | 'boolean';
  label:          string;
  required:       boolean;
  options:        IOption[];
  nextQuestionId: string;
  branchMap:      Record<string, string>;
  showIf:         { questionId: string; operator: string; value: any } | null;
}

export interface IQuestionnaire extends Document {
  version:    number;
  name:       string;
  questions:  IQuestion[];
  isActive:   boolean;
  createdAt:  Date;
}

const OptionSchema = new Schema<IOption>(
  { value: String, label: String },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    id:             { type: String, required: true },
    type:           {
                      type: String,
                      enum: ['text','single','multi','number','boolean'],
                      required: true
                    },
    label:          { type: String, required: true },
    required:       { type: Boolean, default: false },
    options:        [OptionSchema],
    nextQuestionId: { type: String, default: '' },
    branchMap:      { type: Schema.Types.Mixed, default: {} },
    showIf:         { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const QuestionnaireSchema = new Schema<IQuestionnaire>(
  {
    version:   { type: Number, required: true, unique: true },
    name:      { type: String, required: true },
    questions: [QuestionSchema],
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Questionnaire = mongoose.model<IQuestionnaire>(
  'Questionnaire',
  QuestionnaireSchema
);