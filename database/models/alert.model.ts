import { Schema, model, models, type Document, type Model } from "mongoose";

export interface AlertItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  threshold: number;
  isActive: boolean;
  lastTriggeredAt?: Date | null;
  createdAt: Date;
}

const AlertSchema = new Schema<AlertItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    alertName: { type: String, required: true, trim: true },
    alertType: {
      type: String,
      enum: ["upper", "lower"],
      required: true,
      default: "upper",
    },
    threshold: { type: Number, required: true },
    isActive: { type: Boolean, default: true, index: true },
    lastTriggeredAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const AlertModel: Model<AlertItem> =
  (models?.Alert as Model<AlertItem>) || model<AlertItem>("Alert", AlertSchema);
