import mongoose, { Schema, model, models } from "mongoose";

export interface ILoginLog {
  email: string;
  ipAddress: string;
  userAgent?: string;
  status: "success" | "failure";
  reason?: string;
  createdAt: Date;
}

const loginLogSchema = new Schema<ILoginLog>({
  email: { type: String, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String },
  status: { type: String, enum: ["success", "failure"], required: true },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const LoginLog = models.LoginLog || model<ILoginLog>("LoginLog", loginLogSchema);

export default LoginLog;
