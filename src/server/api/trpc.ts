/**
* ВОЗМОЖНО, ВАМ НЕ НУЖНО РЕДАКТИРОВАТЬ ЭТОТ ФАЙЛ, ЕСЛИ ТОЛЬКО:
* 1. Вы хотите изменить контекст запроса (см. Часть 1).
* 2. Вы хотите создать новое промежуточное ПО или тип процедуры (см. Часть 3).
*
* TL;DR — здесь создаются и подключаются все компоненты сервера tRPC.
* Необходимость использования задокументирована соответственно ближе к концу.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type Session } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

/**
* 1. КОНТЕКСТ
 *
 * В этом разделе определяются «контексты», доступные во внутреннем API.
 *
 * Они позволяют вам получить доступ к вещам при обработке запроса, таким как база данных, сеанс и т. д.
 */

type CreateContextOptions = {
  session: Session | null;
};

/**
* Этот помощник генерирует «внутренние элементы» для контекста tRPC. Если вам нужно использовать его, вы можете экспортировать
 * это отсюда.
 *
 * Примеры вещей, для которых он может понадобиться:
 * - тестирование, поэтому нам не нужно издеваться над req/res Next.js
 * - `createSSGHelpers` tRPC, где у нас нет req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

/**
* Это фактический контекст, который вы будете использовать в своем маршрутизаторе. Он будет использоваться для обработки каждого запроса
 * который проходит через вашу конечную точку tRPC.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get the session from the server using the getServerSession wrapper function
  const session = await getServerAuthSession({ req, res });

  return createInnerTRPCContext({
    session,
  });
};

/**
* 2. ИНИЦИАЛИЗАЦИЯ
 *
 * Здесь инициализируется API tRPC, соединяющий контекст и преобразователь. Мы также разбираем
 * ZodErrors, чтобы обеспечить безопасность типов во внешнем интерфейсе в случае сбоя процедуры из-за проверки.
 * ошибки на бэкенде.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
* 3. МАРШРУТИЗАТОР И ПРОЦЕДУРА (ВАЖНАЯ ЧАСТЬ)
 *
 * Это элементы, которые вы используете для создания API tRPC. Вы должны импортировать их много в
 * Каталог "/src/server/api/routers".
 */

/**
 * Вот как вы создаете новые маршрутизаторы и подмаршрутизаторы в своем API tRPC.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
* Публичная (неаутентифицированная) процедура
 *
 * Это базовая часть, которую вы используете для создания новых запросов и изменений в вашем API tRPC. Это не
 * гарантировать, что запрос пользователя авторизован, но вы все равно можете получить доступ к данным сеанса пользователя, если они
 * вошли в систему.
 */
export const publicProcedure = t.procedure;

/** Повторно используемое промежуточное ПО, которое обеспечивает вход пользователей в систему перед запуском процедуры. */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
* Защищенная (аутентифицированная) процедура
 *
 * Если вы хотите, чтобы запрос или мутация были доступны ТОЛЬКО зарегистрированным пользователям, используйте это. Он проверяет
 * сеанс действителен и гарантирует, что `ctx.session.user` не равен нулю.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
