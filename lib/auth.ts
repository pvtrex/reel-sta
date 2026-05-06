import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db";
import UserModel from "../models/User";
import LoginLog from "../models/LoginLog";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const ip = (req?.headers as any)?.["x-forwarded-for"] || "unknown";
        const userAgent = (req?.headers as any)?.["user-agent"] || "unknown";

        try {
          await connectToDatabase();
          const user = await UserModel.findOne({ email: credentials.email });

          if (!user) {
            await LoginLog.create({
              email: credentials.email,
              ipAddress: ip,
              userAgent,
              status: "failure",
              reason: "User not found",
            });
            throw new Error("No user found with this email");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            await LoginLog.create({
              email: credentials.email,
              ipAddress: ip,
              userAgent,
              status: "failure",
              reason: "Invalid password",
            });
            throw new Error("Invalid password");
          }

          await LoginLog.create({
            email: credentials.email,
            ipAddress: ip,
            userAgent,
            status: "success",
          });

          return {
            id: user._id.toString(),
            email: user.email,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
