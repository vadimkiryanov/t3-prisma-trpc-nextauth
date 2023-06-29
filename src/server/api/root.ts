import { topicRouter } from "./routers/topic";
import { exampleRouter } from "~/server/api/routers/example";
import { createTRPCRouter } from "~/server/api/trpc";
import { noteRouter } from "./routers/note";

/**
 * Это основной маршрутизатор для вашего сервера.
 *
 * Все маршрутизаторы, добавленные в /api/routers, должны быть добавлены сюда вручную.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  topic: topicRouter,
  note: noteRouter,
});

// определение типа экспорта API
export type AppRouter = typeof appRouter;
