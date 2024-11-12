import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { polarComponent } from "./util";

const http = httpRouter();

auth.addHttpRoutes(http);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
polarComponent.registerRoutes(http as any);

export default http;
