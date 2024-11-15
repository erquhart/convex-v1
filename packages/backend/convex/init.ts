import { Polar } from "@polar-sh/sdk";
import { asyncMap } from "convex-helpers";
import { internalAction } from "./_generated/server";
import { env } from "./env";

const seedProducts = [
  {
    name: "Free",
    description: "Some of the things, free forever.",
    amountType: "free",
    prices: {
      month: {
        usd: 0,
      },
    },
  },
  {
    name: "Pro",
    description: "All the things for one low monthly price.",
    amountType: "fixed",
    prices: {
      month: {
        usd: 2000,
      },
      year: {
        usd: 19000,
      },
    },
  },
] as const;

export default internalAction(async (ctx) => {
  const polar = new Polar({
    server: "sandbox",
    accessToken: env.POLAR_ACCESS_TOKEN,
  });
  const products = await polar.products.list({
    organizationId: env.POLAR_ORGANIZATION_ID,
  });
  // If Polar products already exist, skip creation and seeding.
  if (products?.result?.items?.length) {
    console.info("🏃‍♂️ Skipping Polar products creation and seeding.");
    return;
  }
  await asyncMap(seedProducts, async (product) => {
    // Create Polar product.
    await polar.products.create({
      organizationId: env.POLAR_ORGANIZATION_ID,
      name: product.name,
      description: product.description,
      prices: Object.entries(product.prices).map(([interval, amount]) => ({
        amountType: product.amountType,
        priceAmount: amount.usd,
        recurringInterval: interval,
      })),
    });
  });

  console.info("📦 Polar Products have been successfully created.");
});
