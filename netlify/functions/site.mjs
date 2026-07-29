import worker from "../../dist/server/index.js";

export default async function handler(request, context) {
  const executionContext = {
    waitUntil(promise) {
      if (typeof context.waitUntil === "function") {
        context.waitUntil(promise);
      }
    },
    passThroughOnException() {},
  };

  return worker.fetch(request, {}, executionContext);
}
