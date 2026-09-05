const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || "";
const NGX_API_KEY = import.meta.env.VITE_NGX_PULSE_API_KEY || "";

const CACHE_KEY = "save-my-way-stock-price-cache";
const US_TTL_MS = 90 * 1000;
const NGX_TTL_MS = 4 * 60 * 1000;
const NGX_REQUEST_GAP_MS = 6500;

const NGX_SYMBOLS = {
  MTNN: ["mtn", "mtn nigeria", "mtnn"],
  DANGSUGAR: ["dangote sugar", "dangsugar", "dangote sugar refinery"],
  DANGCEM: ["dangote cement", "dangcem", "dangote cement plc"],
  GTCO: ["gtco", "guaranty trust", "gtbank", "gt bank"],
  SEPLAT: ["seplat", "seplat energy"],
  ZENITHBANK: ["zenith", "zenith bank", "zenithbank"],
  ACCESSCORP: ["access", "access bank", "accesscorp"],
  FBNH: ["first bank", "fbnh", "fbn holdings"],
  UBA: ["uba", "united bank for africa"],
  AIRTELAFRI: ["airtel", "airtel africa"],
  BUAFOODS: ["bua foods", "buafoods"],
  BUACEMENT: ["bua cement", "buacement"],
  PRESCO: ["presco"],
  NESTLE: ["nestle nigeria", "nestle"],
  NB: ["nigerian breweries", "nb"],
};

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeCache = (cache) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

const cacheKey = (market, symbol) => `${market}:${symbol}`.toUpperCase();

const getCachedPrice = (symbol, market, ttlMs = Infinity) => {
  const cached = readCache()[cacheKey(market, symbol)];
  if (!cached) return null;

  const age = Date.now() - new Date(cached.updatedAt).getTime();
  if (Number.isFinite(ttlMs) && age > ttlMs) return null;

  return { ...cached, fromCache: true };
};

const setCachedPrice = (symbol, market, data) => {
  const cache = readCache();
  cache[cacheKey(market, symbol)] = {
    ...data,
    symbol,
    market,
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
  writeCache(cache);
  return cache[cacheKey(market, symbol)];
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");

const getNgxAliasMatch = (query) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return null;

  const match = Object.entries(NGX_SYMBOLS).find(([symbol, names]) => {
    const normalizedSymbol = normalize(symbol);
    return (
      normalizedSymbol === normalizedQuery ||
      names.some((name) => {
        const normalizedName = normalize(name);
        return (
          normalizedName === normalizedQuery ||
          normalizedName.includes(normalizedQuery) ||
          normalizedQuery.includes(normalizedName)
        );
      })
    );
  });

  if (!match) return null;
  const [symbol, names] = match;
  return {
    symbol,
    displaySymbol: symbol,
    name: names[0],
    market: "NGX",
    source: "local-ngx-symbols",
  };
};

let ngxQueue = Promise.resolve();
let lastNgxRequestAt = 0;

const enqueueNgxRequest = (request) => {
  ngxQueue = ngxQueue.then(async () => {
    const delay = Math.max(0, NGX_REQUEST_GAP_MS - (Date.now() - lastNgxRequestAt));
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    lastNgxRequestAt = Date.now();
    return request();
  });

  return ngxQueue;
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

const getFinnhubUrl = (path, params) => {
  const searchParams = new URLSearchParams({ ...params, token: FINNHUB_API_KEY });
  return `https://finnhub.io/api/v1/${path}?${searchParams.toString()}`;
};

const getNgxHeaders = () => ({
  "Content-Type": "application/json",
  ...(NGX_API_KEY ? { "X-API-Key": NGX_API_KEY } : {}),
});

export const hasMarketDataKeys = () => ({
  finnhub: Boolean(FINNHUB_API_KEY),
  ngx: Boolean(NGX_API_KEY),
});

export const detectMarket = (symbolOrName) => {
  const upperValue = String(symbolOrName || "").trim().toUpperCase();
  if (NGX_SYMBOLS[upperValue] || getNgxAliasMatch(symbolOrName)) return "NGX";
  return "US";
};

export const isNgxMarketOpenNow = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = values.weekday;
  const minutes = Number(values.hour) * 60 + Number(values.minute);
  const isWeekday = !["Sat", "Sun"].includes(weekday);

  return isWeekday && minutes >= 9 * 60 && minutes <= 16 * 60;
};

const getNgxMarketStatus = async () => {
  const cachedStatus = getCachedPrice("MARKET_STATUS", "NGX", 2 * 60 * 1000);
  if (cachedStatus) return cachedStatus;

  if (!NGX_API_KEY) {
    return {
      status: isNgxMarketOpenNow() ? "open" : "closed",
      timestamp: new Date().toISOString(),
      source: "local-hours",
    };
  }

  try {
    const data = await enqueueNgxRequest(() =>
      fetchJson("https://www.ngxpulse.ng/api/ngxdata/market-status", {
        headers: getNgxHeaders(),
      }),
    );

    return setCachedPrice("MARKET_STATUS", "NGX", {
      price: null,
      status: data.status || (isNgxMarketOpenNow() ? "open" : "closed"),
      timestamp: data.timestamp || new Date().toISOString(),
      source: "ngx-pulse",
    });
  } catch {
    return {
      status: isNgxMarketOpenNow() ? "open" : "closed",
      timestamp: new Date().toISOString(),
      source: "local-hours",
    };
  }
};

const searchNgxStock = async (query) => {
  const aliasMatch = getNgxAliasMatch(query);
  if (aliasMatch) return aliasMatch;
  if (!NGX_API_KEY) return null;

  const cachedStocks = getCachedPrice("STOCK_LIST", "NGX", 12 * 60 * 60 * 1000);

  // Always normalize to the raw array, regardless of cache hit or fresh fetch
  let stockList;
  if (cachedStocks?.stockList) {
    stockList = cachedStocks.stockList;
  } else {
    const response = await enqueueNgxRequest(() =>
      fetchJson("https://www.ngxpulse.ng/api/ngxdata/stocks", {
        headers: getNgxHeaders(),
      }),
    );
    stockList = Array.isArray(response?.stocks) ? response.stocks : [];
    setCachedPrice("STOCK_LIST", "NGX", { price: null, stockList, source: "ngx-pulse" });
  }

  const normalizedQuery = normalize(query);
  const match = stockList.find((stock) => {
    const name = normalize(stock.name);
    const symbol = normalize(stock.symbol);
    return (
      symbol === normalizedQuery ||
      name === normalizedQuery ||
      name.includes(normalizedQuery) ||
      normalizedQuery.includes(name)
    );
  });

  if (!match) return null;

  return {
    symbol: match.symbol,
    displaySymbol: match.symbol,
    name: match.name,
    market: "NGX",
    source: "ngx-pulse",
  };
};

const searchFinnhubStock = async (query) => {
  if (FINNHUB_API_KEY) {
    try {
      const data = await fetchJson(getFinnhubUrl("search", { q: query }));
      const result = (data.result || []).find(
        (item) =>
          item.type === "Common Stock" ||
          item.type === "EQS" ||
          item.symbol ||
          item.displaySymbol,
      );

      if (result) {
        return {
          symbol: result.symbol,
          displaySymbol: result.displaySymbol || result.symbol,
          name: result.description || result.symbol,
          market: "US",
          source: "finnhub",
        };
      }
    } catch {
      // fallback
    }
  }

  const upperQuery = query.trim().toUpperCase();
  const POPULAR_US = {
    APPLE: "AAPL",
    AMAZON: "AMZN",
    MICROSOFT: "MSFT",
    TESLA: "TSLA",
    GOOGLE: "GOOGL",
    ALPHABET: "GOOGL",
    NVIDIA: "NVDA",
    META: "META",
    FACEBOOK: "META",
    NETFLIX: "NFLX",
  };

  if (POPULAR_US[upperQuery]) {
    return {
      symbol: POPULAR_US[upperQuery],
      displaySymbol: POPULAR_US[upperQuery],
      name: query.trim(),
      market: "US",
      source: "popular-symbols",
    };
  }

  if (/^[A-Z]{1,5}$/.test(upperQuery)) {
    return {
      symbol: upperQuery,
      displaySymbol: upperQuery,
      name: upperQuery,
      market: "US",
      source: "symbol-lookup",
    };
  }

  return null;
};

export const searchStock = async (query) => {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2) return null;

  const ngxMatch = await searchNgxStock(query);
  if (ngxMatch) return ngxMatch;

  return searchFinnhubStock(query);
};

const getYahooStockPrice = async (symbol) => {
  const data = await fetchJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
  );
  const meta = data?.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Yahoo Finance returned an invalid price");
  }
  return {
    price,
    previousClose:
      Number(meta?.chartPreviousClose) || Number(meta?.previousClose) || null,
    updatedAt: meta?.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString(),
    source: "yahoo-finance",
  };
};

const getUsStockPrice = async (symbol, { allowStale = true, force = false } = {}) => {
  const fresh = getCachedPrice(symbol, "US", US_TTL_MS);
  if (fresh && !force) return fresh;

  if (FINNHUB_API_KEY) {
    try {
      const data = await fetchJson(getFinnhubUrl("quote", { symbol }));
      const price = Number(data.c);
      if (Number.isFinite(price) && price > 0) {
        return setCachedPrice(symbol, "US", {
          price,
          previousClose: Number(data.pc) || null,
          updatedAt: data.t
            ? new Date(data.t * 1000).toISOString()
            : new Date().toISOString(),
          source: "finnhub",
        });
      }
    } catch {
      // Fallback to Yahoo Finance
    }
  }

  try {
    const yahooData = await getYahooStockPrice(symbol);
    return setCachedPrice(symbol, "US", yahooData);
  } catch (error) {
    const stale = allowStale ? getCachedPrice(symbol, "US") : null;
    if (stale) return { ...stale, error: error.message };
    throw error;
  }
};

const DEFAULT_NGX_PRICES = {
  ACCESSCORP: 30.00,
  MTNN: 813.00,
  DANGCEM: 1034.00,
  DANGSUGAR: 72.00,
  GTCO: 132.69,
  SEPLAT: 13552.60,
  ZENITHBANK: 128.60,
  FBNH: 31.50,
  UBA: 45.85,
  AIRTELAFRI: 2150.00,
  BUAFOODS: 379.00,
  BUACEMENT: 143.00,
  PRESCO: 485.00,
  NESTLE: 900.00,
  NB: 30.00,
};

const getNgxStockPrice = async (symbol, { allowStale = true, force = false } = {}) => {
  const upperSymbol = String(symbol || "").trim().toUpperCase();
  const fresh = getCachedPrice(upperSymbol, "NGX", NGX_TTL_MS);
  if (fresh && !force) return fresh;

  const marketStatus = await getNgxMarketStatus();
  const stale = allowStale ? getCachedPrice(upperSymbol, "NGX") : null;

  if (marketStatus.status !== "open" && stale && !force) {
    return { ...stale, marketStatus: "closed" };
  }

  if (!NGX_API_KEY) {
    if (stale) return stale;
    if (DEFAULT_NGX_PRICES[upperSymbol]) {
      return setCachedPrice(upperSymbol, "NGX", {
        price: DEFAULT_NGX_PRICES[upperSymbol],
        previousClose: null,
        changePercent: null,
        name: upperSymbol,
        updatedAt: new Date().toISOString(),
        marketStatus: marketStatus.status,
        source: "reference-index",
      });
    }
    throw new Error("Missing VITE_NGX_PULSE_API_KEY");
  }

  try {
    const response = await enqueueNgxRequest(() =>
      fetchJson(`https://www.ngxpulse.ng/api/ngxdata/prices/${encodeURIComponent(upperSymbol)}?days=2`, {
        headers: getNgxHeaders(),
      }),
    );

    const priceHistory = Array.isArray(response?.prices) ? response.prices : [];
    const latest = priceHistory[priceHistory.length - 1];
    const previous = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2] : null;

    const price = Number(latest?.close_price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("NGX Pulse returned an invalid price");
    }

    const previousClose = Number(previous?.close_price) || null;
    const changePercent = previousClose
      ? ((price - previousClose) / previousClose) * 100
      : null;

    return setCachedPrice(upperSymbol, "NGX", {
      price,
      previousClose,
      changePercent,
      name: response.name || response.symbol,
      updatedAt: latest?.trade_date || new Date().toISOString(),
      marketStatus: marketStatus.status,
      source: "ngx-pulse",
    });
  } catch (error) {
    if (stale) return { ...stale, error: error.message };
    if (DEFAULT_NGX_PRICES[upperSymbol]) {
      return setCachedPrice(upperSymbol, "NGX", {
        price: DEFAULT_NGX_PRICES[upperSymbol],
        previousClose: null,
        changePercent: null,
        name: upperSymbol,
        updatedAt: new Date().toISOString(),
        marketStatus: marketStatus.status,
        source: "reference-index",
      });
    }
    throw error;
  }
};

export const getStockPrice = async (symbol, market, options = {}) => {
  const resolvedMarket = market || detectMarket(symbol);
  if (resolvedMarket === "NGX") {
    return getNgxStockPrice(symbol, options);
  }
  return getUsStockPrice(symbol, options);
};

export const getLastCachedStockPrice = (symbol, market) => getCachedPrice(symbol, market);
