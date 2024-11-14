import { getAuthUserId } from "@convex-dev/auth/server";
import { Polar as PolarComponent } from "@convex-dev/polar";
import { Polar } from "@polar-sh/sdk";
import { WebhookSubscriptionCreatedPayload$inboundSchema } from "@polar-sh/sdk/models/components";
import { v } from "convex/values";
import { sortBy } from "remeda";
import { api, components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { env } from "./env";

const polarComponent = new PolarComponent(components.polar);
export { polarComponent as polar };

export const getOnboardingCheckoutUrl = action({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(api.users.getUser);
    if (!user) {
      throw new Error("User not found");
    }
    const plans = await polarComponent.listProducts(ctx, {
      includeArchived: false,
    });
    const freePlan = plans.find(
      (plan) =>
        plan.isRecurring &&
        Object.values(plan.prices).some((price) => price.amountType === "free"),
    );
    const price = freePlan?.prices.find(
      (price) =>
        price.recurringInterval === "month" && price.amountType === "free",
    );
    if (!price) {
      throw new Error("Price not found");
    }
    if (!user.email) {
      throw new Error("User email not found");
    }
    const polar = new Polar({
      server: "sandbox",
      accessToken: env.POLAR_ACCESS_TOKEN,
    });
    const result = await polar.checkouts.custom.create({
      productPriceId: price.id,
      successUrl: `${env.SITE_URL}/settings/billing`,
      customerEmail: user.email,
      metadata: {
        userId: user._id,
      },
    });
    return result.url;
  },
});

export const listPlans = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not found");
    }
    const plans = await polarComponent.listProducts(ctx, {
      includeArchived: false,
    });
    return sortBy(
      plans,
      (plan) => !plan.prices.some((price) => price.amountType === "free"),
    );
  },
});

export const updateCheckoutTimestamp = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not found");
    }
    await ctx.db.patch(userId, {
      lastCheckoutTimestamp: Date.now(),
    });
  },
});

export const polarEventCallback = internalMutation({
  args: {
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    switch (args.payload.type) {
      case "subscription.created": {
        const payload = WebhookSubscriptionCreatedPayload$inboundSchema.parse(
          args.payload,
        );
        const userId = payload.data.metadata.userId;
        await ctx.db.patch(userId as Id<"users">, {
          polarId: payload.data.userId,
        });
        break;
      }
    }
  },
});
