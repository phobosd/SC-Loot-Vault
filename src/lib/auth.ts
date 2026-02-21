import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async session({ session, user }: any) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.orgId = user.orgId;
      }
      return session;
    },
    async signIn({ user, account, profile }: any) {
      // Logic to assign users to an Org on first sign-in if not already assigned
      if (!user.orgId) {
        const defaultOrg = await prisma.org.findFirst({
          where: { slug: "dixncox" }
        });
        if (defaultOrg) {
          user.orgId = defaultOrg.id;
        }
      }
      return true;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
};
