import type { Systemic } from 'systemic-ts';

const signals = ['SIGINT', 'SIGTERM'] as const;

interface RunnerOptions {
  logger?: Record<'info' | 'error', (message: string) => void>;
}

export function runner<T extends Pick<Systemic<any>, 'start' | 'stop'>>(
  system: T,
  options: RunnerOptions = {}
): Pick<T, 'start' | 'stop'> {
  const logger = options.logger || console;

  function logError(error: unknown) {
    if (error instanceof Error && error.stack) {
      logger.error(error.stack);
    }
  }

  async function stopAndExit(code: number) {
    try {
      await system.stop();
    } catch (error) {
      logger.error('System failed to stop.');
      logError(error);
    } finally {
      process.exit(code);
    }
  }

  async function start(): Promise<ReturnType<T['start']>> {
    try {
      const components = await system.start();

      process.on('error', (error) => {
        logger.error('Unhandled error. Invoking shutdown.');
        logError(error);
        stopAndExit(1);
      });

      process.on('unhandledRejection', (error) => {
        logger.error('Unhandled rejection. Invoking shutdown.');
        logError(error);
        stopAndExit(1);
      });

      signals.forEach((signal) => {
        process.on(signal, () => {
          logger.info(`Received ${signal}. Attempting to shutdown gracefully.`);
          stopAndExit(0);
        });
      });

      return components as ReturnType<T['start']>;
    } catch (error) {
      logger.error('System failed to start.');
      logError(error);
      process.exit(1);
    }
  }

  function stop() {
    return system.stop();
  }

  return {
    start,
    stop,
  };
}
