import { createLogger, createSystemic } from './mocks';
import { runner } from '../src/runner';

describe('Runner', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('starts the system', async () => {
    const system = createSystemic();
    const components = await runner(system).start();

    expect(components).toEqual({ foo: { foo: 'bar' }, bar: { bar: 'baz' } });
    expect(system.start).toHaveBeenCalledTimes(1);
  });

  it('stops the system', async () => {
    const system = createSystemic();
    const { stop } = runner(system);

    await stop();

    expect(system.stop).toHaveBeenCalledTimes(1);
  });

  it('exits the process when it fails to start', async () => {
    const system = createSystemic();
    system.start.mockRejectedValue(new Error('Failed to start'));
    const logger = createLogger();

    jest.spyOn(process, 'exit').mockImplementation((n) => {
      throw new Error(`${n}`);
    });

    await expect(() => runner(system, { logger }).start()).rejects.toThrow('1');

    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith('System failed to start.');
    expect(logger.error).toHaveBeenCalledWith(expect.stringMatching('Failed to start'));
  });

  it('stops the system and exists when an SIGINT signal is received', async () => {
    const system = createSystemic();
    const logger = createLogger();

    const processSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      /* noop */
    }) as any);

    await runner(system, { logger }).start();

    expect(system.start).toHaveBeenCalledTimes(1);
    expect(system.stop).toHaveBeenCalledTimes(0);

    process.emit('SIGINT');

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(system.stop).toHaveBeenCalledTimes(1);
    // expect(processSpy).toHaveBeenCalledTimes(1);
    expect(processSpy).toHaveBeenCalledWith(0);

    expect(logger.info).toHaveBeenCalledWith('Received SIGINT. Attempting to shutdown gracefully.');
  });

  it('stops the system and exits the process when an unhandled rejection occurs', async () => {
    const system = createSystemic();
    const logger = createLogger();

    const processSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      /* noop */
    }) as any);

    await runner(system, { logger }).start();

    expect(system.start).toHaveBeenCalledTimes(1);
    expect(system.stop).toHaveBeenCalledTimes(0);

    process.emit('unhandledRejection' as any, new Error('Unhandled rejection error'));

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(system.stop).toHaveBeenCalledTimes(1);
    // expect(processSpy).toHaveBeenCalledTimes(1);
    expect(processSpy).toHaveBeenCalledWith(1);

    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith('Unhandled rejection. Invoking shutdown.');
    expect(logger.error).toHaveBeenCalledWith(expect.stringMatching('Unhandled rejection error'));
  });
});
