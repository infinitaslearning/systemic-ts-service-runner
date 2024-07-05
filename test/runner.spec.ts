import { createLogger, createSystemic } from "./mocks";
import { runner } from "../src";

describe("Runner", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.removeAllListeners();
  });

  it("starts the system", async () => {
    const system = createSystemic();
    const components = await runner(system).start();

    expect(components).toEqual({ foo: { foo: "bar" }, bar: { bar: "baz" } });
    expect(system.start).toHaveBeenCalledTimes(1);
  });

  it("stops the system", async () => {
    const system = createSystemic();
    const { stop } = runner(system);

    await stop();

    expect(system.stop).toHaveBeenCalledTimes(1);
  });

  it("throws an error when it fails to start", async () => {
    const system = createSystemic();
    system.start.mockRejectedValue(new Error("Failed to start"));

    await expect(() => runner(system).start()).rejects.toThrow("Failed to start");
  });

  it.each(["SIGINT", "SIGTERM"] as const)(
    "stops the system and exists when an %s signal is received",
    async (signal) => {
      const system = createSystemic();
      const logger = createLogger();

      const processSpy = jest.spyOn(process, "exit").mockImplementation((() => {
        /* noop */
      }) as any);

      await runner(system, { logger }).start();

      expect(system.start).toHaveBeenCalledTimes(1);
      expect(system.stop).toHaveBeenCalledTimes(0);

      process.emit(signal);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(system.stop).toHaveBeenCalledTimes(1);
      expect(processSpy).toHaveBeenCalledTimes(1);
      expect(processSpy).toHaveBeenCalledWith(0);

      expect(logger.info).toHaveBeenCalledWith(
        `Received ${signal}. Attempting to shutdown gracefully.`,
      );
    },
  );

  it.each([
    ["error", "error"],
    ["rejection", "unhandledRejection"],
  ])("stops the system and exits the process when an unhandled %s occurs", async (name, event) => {
    const system = createSystemic();
    const logger = createLogger();

    const processSpy = jest.spyOn(process, "exit").mockImplementation((() => {
      /* noop */
    }) as any);

    await runner(system, { logger }).start();

    expect(system.start).toHaveBeenCalledTimes(1);
    expect(system.stop).toHaveBeenCalledTimes(0);

    process.emit(event as any, new Error("Unhandled error"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(system.stop).toHaveBeenCalledTimes(1);
    expect(processSpy).toHaveBeenCalledTimes(1);
    expect(processSpy).toHaveBeenCalledWith(1);

    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(`Unhandled ${name}. Invoking shutdown.`);
    expect(logger.error).toHaveBeenCalledWith(expect.stringMatching("Unhandled error"));
  });
});
