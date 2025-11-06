import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const player = await prisma.player.findUnique({
          where: { email: credentials.email },
        });

        if (!player || !player.passwordHash) {
          throw new Error('Credenciais inválidas');
        }

        const isPasswordValid = await compare(
          credentials.password,
          player.passwordHash,
        );

        if (!isPasswordValid) {
          throw new Error('Credenciais inválidas');
        }

        // Update last login
        await prisma.player.update({
          where: { id: player.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: player.id,
          email: player.email,
          name: player.username,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
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
  secret: process.env.NEXTAUTH_SECRET,
};
