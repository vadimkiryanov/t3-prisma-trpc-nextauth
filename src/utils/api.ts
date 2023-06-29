/**
* Это точка входа на стороне клиента для вашего API tRPC. Он используется для создания объекта `api`, который
 * содержит оболочку приложения Next.js, а также ваши безопасные для типов хуки React Query.
 *
 * Мы также создаем несколько помощников вывода для типов ввода и вывода.
 */
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";
import { type AppRouter } from "~/server/api/root";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // браузер должен использовать относительный URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR должен использовать URL Vercel
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR должен использовать localhost
};

/** Набор типобезопасных ответных запросов для вашего API tRPC. */
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      /**
       * Преобразователь, используемый для десериализации данных с сервера.
       *
       * @see https://trpc.io/docs/data-transformers
       */
      transformer: superjson,

      /**
       * Ссылки, используемые для определения потока запросов от клиента к серверу.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    };
  },
  /**
   * Должен ли tRPC ожидать запросов при отображении сервером страниц.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: false,
});

/**
 * Помощник по выводу для входных данных.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Помощник по выводу для выходных данных.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
