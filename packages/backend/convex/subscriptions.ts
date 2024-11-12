import { getAuthUserId } from "@convex-dev/auth/server";
import { Polar } from "@polar-sh/sdk";
import { api } from "./_generated/api";
import { action, internalAction, mutation, query } from "./_generated/server";
import { env } from "./env";
import { polarComponent } from "./util";
const createCheckout = async ({
  customerEmail,
  productPriceId,
  successUrl,
  subscriptionId,
}: {
  customerEmail: string;
  productPriceId: string;
  successUrl: string;
  subscriptionId?: string;
}) => {
  const polar = new Polar({
    server: "sandbox",
    accessToken: env.POLAR_ACCESS_TOKEN,
  });
  const result = await polar.checkouts.create({
    productPriceId,
    successUrl,
    customerEmail,
    subscriptionId,
  });
  return result;
};

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
    console.log("freePlan", freePlan);
    console.log("price", price);
    if (!price) {
      throw new Error("Price not found");
    }
    if (!user.email) {
      throw new Error("User email not found");
    }
    const checkout = await createCheckout({
      customerEmail: user.email,
      productPriceId: price.id,
      successUrl: `${env.SITE_URL}/settings/billing`,
    });
    return checkout.url;
  },
});

export const listPlans = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not found");
    }
    return polarComponent.listProducts(ctx, {
      includeArchived: false,
    });
  },
});

export const pullProducts = internalAction({
  args: {},
  handler: async (ctx) => {
    await polarComponent.pullProducts(ctx);
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
