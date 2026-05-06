import LoginLog from "@/models/LoginLog";
import { connectToDatabase } from "./db";

export async function logAdminAccess(email: string, ipAddress: string, status: "success" | "failure", reason?: string) {
  try {
    await connectToDatabase();
    await LoginLog.create({
      email,
      ipAddress,
      status,
      reason,
      role: "admin", // Explicitly tag as admin attempt
    });
  } catch (error) {
    console.error("Failed to log admin access:", error);
  }
}
