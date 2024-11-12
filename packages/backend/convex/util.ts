import { Polar } from "@convex-dev/polar";
import { components } from "./_generated/api";

export const polarComponent = new Polar(components.polar, {
  httpPath: "/events/polar",
});
