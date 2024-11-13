/**
 * Locales.
 *
 * Update this logic to reflect supported currencies in your app.
 */
export function getLocaleCurrency() {
  return navigator.languages.includes("en-US")
    ? "usd"
    : // This can be replaced with "eur" for apps that support only USD and EUR.
      "usd";
}
