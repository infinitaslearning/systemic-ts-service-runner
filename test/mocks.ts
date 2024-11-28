import { systemic } from "@ilpt/systemic-ts";

export function createSystemic() {
  const system = systemic().add("foo", { foo: "bar" }).add("bar", { bar: "baz" });
  return {
    start: jest.fn(() => system.start()),
    stop: jest.fn(() => system.stop()),
    name: "test",
  };
}

export function createLogger() {
  return { info: jest.fn(), error: jest.fn() };
}
