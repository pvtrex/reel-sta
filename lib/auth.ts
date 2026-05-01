import { NextAuthOptions } from "next-auth"
import CredentialProvider from "next-auth/providers/credentials"
import { connectToDatabase } from "./db"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialProvider({
      name : "credentials",
      credentials : {
        email : {label : "email",type : "email"},
        password : {label : "password",type : "password"},
      },
      async authorize(credentials) {
        
     if(!credentials?.email || !credentials.password) throw new Error("Missing email or password")
      
      try {
        await connectToDatabase()
        const user = User.findOne({email: credentials.email})
        if(!user) {
          throw new Error("user not found")
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )
        
        if(!isValid) {
          throw new Error("password not match")
        }
        return {
          id:user._id.toString(),
          email:user.email
        }
      } catch (error) {
        console.log(error)
        return null
      }
      },

    })
  ],
}
