// ponytail: tiny public-suffix subset covering this dataset (nubank.com.br); swap for `tldts` if inputs go global.
const SECOND_LEVEL_TLDS = new Set(["com.br", "co.uk", "com.au", "co.jp"]);

export function registrableDomain(input: string): string {
  const host = input.toLowerCase().trim().replace(/^.*@/, "").replace(/^https?:\/\//, "").split("/")[0];
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  const lastTwo = parts.slice(-2).join(".");
  return SECOND_LEVEL_TLDS.has(lastTwo) ? parts.slice(-3).join(".") : lastTwo;
}
