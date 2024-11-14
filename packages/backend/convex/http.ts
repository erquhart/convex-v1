import { Polar as PolarComponent } from "@erquhart/convex-polar";
import { httpRouter } from "convex/server";
import { api, components, internal } from "./_generated/api";
import { auth } from "./auth";
import { polar } from "./subscriptions";

const http = httpRouter();

auth.addHttpRoutes(http);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
polar.registerRoutes(http as any, {
  path: "/events/polar",
  eventCallback: internal.subscriptions.polarEventCallback,
});

export default http;
