import { defineEnum } from "@pi-pack/ts-utils";

const brand = Symbol("Protocol");

// Declaration emit must be able to name the inferred type using the public package entry point.
const Protocol = defineEnum(brand).add("Http2", "h2").add("Http3", "h3");
const defaultProtocol = Protocol.Http2;

export { defaultProtocol, Protocol };
