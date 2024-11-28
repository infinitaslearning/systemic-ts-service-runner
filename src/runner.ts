import type { Systemic } from "@ilpt/systemic-ts";

const signals = ["SIGINT", "SIGTERM"] as const;

interface RunnerOptions {
  logger?: Record<"info" | "error", (message: string) => void>;
}

export function runner<T extends Pick<Systemic<any>, "start" | "stop" | "name">>(
  system: T,
  { logger = console }: RunnerOptions = {},
): Pick<T, "start" | "stop" | "name"> {
  function logError(error: unknown) {
    if (error instanceof Error && error.stack) {
      logger.error(error.stack);
    }
  }

  async function stopAndExit(code: number) {
    try {
      await system.stop();
    } catch (error) {
      logger.error("System failed to stop.");
      logError(error);
    } finally {
      process.exit(code);
    }
  }

  async function start(): Promise<ReturnType<T["start"]>> {
    process.on("error", (error) => {
      logger.error("Unhandled error. Invoking shutdown.");
      logError(error);
      stopAndExit(1);
    });

    process.on("unhandledRejection", (error) => {
      logger.error("Unhandled rejection. Invoking shutdown.");
      logError(error);
      stopAndExit(1);
    });

    for (const signal of signals) {
      process.on(signal, () => {
        logger.info(`Received ${signal}. Attempting to shutdown gracefully.`);
        stopAndExit(0);
      });
    }

    const components = (await system.start()) as ReturnType<T["start"]>;
    logger.info(`System ${system.name} started successfully.`);

    return components;
  }

  function stop() {
    return system.stop();
  }

  return {
    start,
    stop,
    name: system.name,
  };
}
