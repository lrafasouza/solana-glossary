interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

export interface SolPrice {
  usd: number;
  usd_24h_change: number;
}

const DEFI_TERMS = new Set([
  "amm",
  "liquidity-pool",
  "swap",
  "slippage",
  "dex",
  "yield-farming",
  "impermanent-loss",
]);

let priceCache: CacheEntry<SolPrice> | null = null;

export async function getSolPrice(): Promise<SolPrice | null> {
  if (priceCache && priceCache.expiresAt > Date.now()) {
    return priceCache.value;
  }

  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true",
    );
    if (!response.ok) {
      throw new Error(`CoinGecko request failed: ${response.status}`);
    }

    const json = (await response.json()) as {
      solana?: { usd?: number; usd_24h_change?: number };
    };
    const value = json.solana;
    if (!value?.usd || typeof value.usd_24h_change !== "number") {
      throw new Error("CoinGecko data missing");
    }

    const result: SolPrice = {
      usd: value.usd,
      usd_24h_change: value.usd_24h_change,
    };
    priceCache = {
      value: result,
      expiresAt: Date.now() + 300_000,
    };
    return result;
  } catch {
    return null;
  }
}

export async function getSolPriceLine(termId: string): Promise<string | null> {
  if (!DEFI_TERMS.has(termId)) return null;

  const price = await getSolPrice();
  if (!price) return null;

  const sign = price.usd_24h_change >= 0 ? "+" : "";
  return `💰 <b>SOL:</b> $${price.usd.toFixed(2)} ${sign}${price.usd_24h_change.toFixed(1)}% (24h)`;
}
