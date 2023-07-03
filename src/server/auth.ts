import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";

/**
 * Расширение модуля для типов `next-auth`. Позволяет нам добавлять пользовательские свойства к сессии.
 * объект и сохранять типы в безопасности.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Параметры для NextAuth.js, используемые для настройки адаптеров, провайдеров, обратных вызовов и т.д.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    /**
     * ...добавить больше провайдеров здесь.
     *
     * Большинство других провайдеров требуют немного больше работы, чем провайдер GITHUB. Например.
     * провайдер GitHub требует добавить поле `refresh_token_expires_in` в модель аккаунта.
     * модели. Обратитесь к документации NextAuth.js для провайдера, который вы хотите использовать. Пример:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Обертка для `getServerSession`, чтобы вам не нужно было импортировать `authOptions` в каждый файл.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
