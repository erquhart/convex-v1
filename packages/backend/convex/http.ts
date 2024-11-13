import { Polar as PolarComponent } from "@convex-dev/polar";
import { httpRouter } from "convex/server";
import { api, components, internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

const polarComponent = new PolarComponent(components.polar);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
polarComponent.registerRoutes(http as any, {
  path: "/events/polar",
  eventCallback: internal.subscriptions.polarEventCallback,
});

export default http;
