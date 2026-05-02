import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 29918cf65ad23af40f215411a3bd84847398af4a
