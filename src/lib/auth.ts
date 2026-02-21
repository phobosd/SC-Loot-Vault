import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const providers: any[] = [
    CredentialsProvider({
      name: "Personnel Credentials",
      credentials: {
        username: { label: "Designation", type: "text", placeholder: "C.ROBERTS" },
        password: { label: "Security Key", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username.toUpperCase() },
            include: { org: true }
          });

          if (!user || !user.password) return null;

          if (user.status === "PENDING") {
            throw new Error("Enrollment Pending: Your designation is awaiting administrative authorization.");
          }
          if (user.status === "REJECTED") {
            throw new Error("Access Denied: Your enrollment request has been decommissioned.");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name || user.username,
            email: user.email,
            role: user.role,
            orgId: user.orgId,
            orgSlug: user.org?.slug
          };
        } catch (err: any) {
          console.error("[AUTH ERROR]", err.message);
          return null;
        }
      }
    }),
];

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.orgId = user.orgId;
        token.orgSlug = user.orgSlug;
      }

      // Handle Impersonation Updates
      if (trigger === "update" && session?.impersonateId) {
        // Verify original user was a SUPERADMIN
        const originalUser = await prisma.user.findUnique({ where: { id: token.originalId || token.id } });
        if (originalUser?.role !== "SUPERADMIN") return token;

        const targetUser = await prisma.user.findUnique({ 
          where: { id: session.impersonateId },
          include: { org: true }
        });

        if (targetUser) {
          token.originalId = token.originalId || token.id; // Keep track of who is actually logged in
          token.id = targetUser.id;
          token.role = targetUser.role;
          token.orgId = targetUser.orgId;
          token.orgSlug = targetUser.org?.slug;
          token.isImpersonating = true;
        }
      }

      // Handle Stop Impersonation
      if (trigger === "update" && session?.stopImpersonating) {
        const originalUser = await prisma.user.findUnique({ 
          where: { id: token.originalId },
          include: { org: true }
        });
        if (originalUser) {
          token.id = originalUser.id;
          token.role = originalUser.role;
          token.orgId = originalUser.orgId;
          token.orgSlug = originalUser.org?.slug;
          token.isImpersonating = false;
          delete token.originalId;
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.orgId = token.orgId;
        session.user.orgSlug = token.orgSlug;
        session.user.isImpersonating = token.isImpersonating;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'none',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true
      }
    }
  }
};
