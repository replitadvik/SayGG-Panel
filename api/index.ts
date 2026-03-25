import app, { initApp } from "./app";
import type { IncomingMessage, ServerResponse } from "http";

let ready: Promise<void> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!ready) {
    ready = initApp();
  }
  await ready;
  app(req, res);
}
