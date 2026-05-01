import { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * The DefaultSession type extends the JWT interface with a session user.
     * We augment this to include user ID and email, which we'll use for API routes.
     */
    interface Session {
        user: {
            id: string;
        } & DefaultSession["user"]
    }

}
