import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import { detectMarket, searchStock, getStockPrice } from "./marketData.js";
import { setCustomExchangeRate } from "./currency.js";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "6.3.289"}/pdf.worker.min.mjs`;
  }
}

/**
 * Common stock company name to ticker symbol & market dictionary
 */
export const POPULAR_NAME_TO_TICKER = {
  apple: { symbol: "AAPL", market: "US" },
  amazon: { symbol: "AMZN", market: "US" },
  tesla: { symbol: "TSLA", market: "US" },
  google: { symbol: "GOOGL", market: "US" },
  alphabet: { symbol: "GOOGL", market: "US" },
  microsoft: { symbol: "MSFT", market: "US" },
  meta: { symbol: "META", market: "US" },
  facebook: { symbol: "META", market: "US" },
  nvidia: { symbol: "NVDA", market: "US" },
  netflix: { symbol: "NFLX", market: "US" },
  access: { symbol: "ACCESSCORP", market: "NGX" },
  "access bank": { symbol: "ACCESSCORP", market: "NGX" },
  "access corp": { symbol: "ACCESSCORP", market: "NGX" },
  mtn: { symbol: "MTNN", market: "NGX" },
  "mtn nigeria": { symbol: "MTNN", market: "NGX" },
  seplat: { symbol: "SEPLAT", market: "NGX" },
  "seplat energy": { symbol: "SEPLAT", market: "NGX" },
  dangcem: { symbol: "DANGCEM", market: "NGX" },
  "dangote cement": { symbol: "DANGCEM", market: "NGX" },
  dangsugar: { symbol: "DANGSUGAR", market: "NGX" },
  "dangote sugar": { symbol: "DANGSUGAR", market: "NGX" },
  gtco: { symbol: "GTCO", market: "NGX" },
  "gtco bank": { symbol: "GTCO", market: "NGX" },
  "gt bank": { symbol: "GTCO", market: "NGX" },
  "guaranty trust": { symbol: "GTCO", market: "NGX" },
  zenith: { symbol: "ZENITHBANK", market: "NGX" },
  "zenith bank": { symbol: "ZENITHBANK", market: "NGX" },
  uba: { symbol: "UBA", market: "NGX" },
  "united bank for africa": { symbol: "UBA", market: "NGX" },
  fbnh: { symbol: "FBNH", market: "NGX" },
  "first bank": { symbol: "FBNH", market: "NGX" },
  airtel: { symbol: "AIRTELAFRI", market: "NGX" },
  "airtel africa": { symbol: "AIRTELAFRI", market: "NGX" },
  buafoods: { symbol: "BUAFOODS", market: "NGX" },
  "bua foods": { symbol: "BUAFOODS", market: "NGX" },
  buacement: { symbol: "BUACEMENT", market: "NGX" },
  "bua cement": { symbol: "BUACEMENT", market: "NGX" },
  presco: { symbol: "PRESCO", market: "NGX" },
  nestle: { symbol: "NESTLE", market: "NGX" },
  "nestle nigeria": { symbol: "NESTLE", market: "NGX" },
  nb: { symbol: "NB", market: "NGX" },
  "nigerian breweries": { symbol: "NB", market: "NGX" },
};

/**
 * Strips currency symbols, commas, and whitespace to extract a clean number
 */
export const cleanNumber = (val) => {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val)
    .replace(/[^0-9.-]/g, "")
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

/**
 * Normalizes header string for column matching
 */
const normalizeHeader = (header) =>
  String(header || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

// Column synonyms dictionary
const COLUMN_SYNONYMS = {
  symbol: [
    "symbol",
    "ticker",
    "code",
    "stocksymbol",
    "tickersymbol",
    "securitysymbol",
    "instrumentsymbol",
  ],
  name: [
    "name",
    "stock",
    "stockname",
    "company",
    "companyname",
    "security",
    "securityname",
    "description",
    "instrument",
    "instrumentname",
    "holding",
    "asset",
    "usstock",
    "usstocks",
    "nigerianstock",
    "nigerianstocks",
    "ngxstock",
    "ngxstocks",
    "foreignstocks",
    "localstocks",
    "equities",
    "sharesname",
    "symbolorname",
    "item",
  ],
  shares: [
    "shares",
    "qty",
    "quantity",
    "units",
    "unit",
    "holding",
    "holdings",
    "volume",
    "numberofshares",
    "amountofshares",
    "noofshares",
    "sharecount",
    "totalshares",
    "amtowned",
    "amountowned",
    "unitsowned",
    "sharesowned",
    "balance",
  ],
  buyPrice: [
    "buyprice",
    "purchaseprice",
    "avgprice",
    "averageprice",
    "avgcost",
    "averagecost",
    "costprice",
    "costpershare",
    "unitcost",
    "purchasecost",
    "buyrate",
    "avgcostprice",
    "boughtprice",
    "avgpurchaseprice",
    "purchasepricepershare",
  ],
  currentPrice: [
    "currentprice",
    "marketprice",
    "lastprice",
    "latestprice",
    "cmp",
    "nav",
    "closeprice",
    "closingprice",
    "price",
    "currentmarketprice",
    "unitprice",
    "currentvalueperstock",
    "valueperstock",
    "currentvaluepershare",
    "pricepershare",
    "priceperunit",
    "lasttradeprice",
  ],
  currentValue: [
    "currentvalueofmystock",
    "currentvalue",
    "totalcurrentvalue",
    "totalvalue",
    "marketvalue",
    "portfoliovalue",
  ],
  amountSpent: [
    "amountspent",
    "totalspent",
    "totalcost",
    "totalinvested",
    "investedamount",
    "totalinvestment",
    "costbasis",
    "totalamount",
    "totalpurchaseprice",
    "bookvalue",
    "invested",
    "spent",
    "totalbuyvalue",
    "cost",
    "totalbookvalue",
    "purchasevalue",
  ],
  market: [
    "market",
    "exchange",
    "markettype",
    "stockexchange",
    "country",
  ],
  currency: [
    "currency",
    "curr",
    "basecurrency",
    "cur",
    "denomination",
  ],
};

/**
 * Identifies column mapping from raw header row and detects context market (US vs NGX)
 */
const mapHeaders = (headers) => {
  const mapping = {};
  let contextMarket = "";

  headers.forEach((header, index) => {
    const norm = normalizeHeader(header);
    if (!norm) return;

    if (
      norm.includes("usstock") ||
      norm === "us" ||
      norm.includes("foreignstock") ||
      norm.includes("nasdaq") ||
      norm.includes("nyse")
    ) {
      contextMarket = "US";
    }
    if (
      norm.includes("nigerian") ||
      norm.includes("ngx") ||
      norm.includes("localstock") ||
      norm.includes("nse")
    ) {
      contextMarket = "NGX";
    }

    for (const [key, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
      if (!mapping[key] && synonyms.some((syn) => norm === syn || norm.includes(syn))) {
        mapping[key] = index;
        break;
      }
    }
  });

  return { mapping, contextMarket };
};

/**
 * Checks whether a row is a table header row
 */
const isHeaderRow = (row) => {
  if (!Array.isArray(row)) return false;
  const { mapping } = mapHeaders(row);
  return (
    (mapping.name !== undefined || mapping.symbol !== undefined) &&
    (mapping.shares !== undefined ||
      mapping.currentPrice !== undefined ||
      mapping.amountSpent !== undefined ||
      mapping.buyPrice !== undefined)
  );
};

/**
 * Parses a 2D array of rows from a spreadsheet, supporting multiple stacked tables,
 * side summaries, and sections.
 */
const parseRowsArray = (rows, defaultMarket = "") => {
  if (!rows || rows.length === 0) return [];

  const results = [];
  const seenKey = new Set();

  let currentHeader = null;
  let currentMarket = defaultMarket;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (!Array.isArray(row)) continue;

    // Check if this row is a new sub-table header
    if (isHeaderRow(row)) {
      const { mapping, contextMarket } = mapHeaders(row);
      currentHeader = mapping;
      if (contextMarket) {
        currentMarket = contextMarket;
      }
      continue;
    }

    if (!currentHeader) continue;

    const rawName =
      currentHeader.name !== undefined ? String(row[currentHeader.name] || "").trim() : "";
    const rawSymbol =
      currentHeader.symbol !== undefined ? String(row[currentHeader.symbol] || "").trim() : "";
    const nameOrSymbol = rawName || rawSymbol;

    // Skip empty rows or summary/total/balance rows
    if (!nameOrSymbol) continue;
    if (
      /^(total|grand total|portfolio value|portfolio weight|leftover|balance|networth|diffrence|difference|summary|average|cash|uninvested|liquidity|rate bamboo|total cost|total diffrence|buy and sell)/i.test(
        nameOrSymbol
      )
    ) {
      continue;
    }

    const rawShares = currentHeader.shares !== undefined ? row[currentHeader.shares] : "";
    const rawPrice = currentHeader.currentPrice !== undefined ? row[currentHeader.currentPrice] : "";
    const rawCurrentVal = currentHeader.currentValue !== undefined ? row[currentHeader.currentValue] : "";
    const rawBuyPrice = currentHeader.buyPrice !== undefined ? row[currentHeader.buyPrice] : "";
    const rawSpent = currentHeader.amountSpent !== undefined ? row[currentHeader.amountSpent] : "";
    const rawMarket =
      currentHeader.market !== undefined ? String(row[currentHeader.market] || "").trim().toUpperCase() : "";
    const rawCurrency =
      currentHeader.currency !== undefined ? String(row[currentHeader.currency] || "").trim().toUpperCase() : "";

    const shares = cleanNumber(rawShares);
    let currentPrice = cleanNumber(rawPrice);
    const currentValue = cleanNumber(rawCurrentVal);
    let buyPrice = cleanNumber(rawBuyPrice);
    let amountSpent = cleanNumber(rawSpent);

    // Skip if row has no numeric metrics
    if (shares <= 0 && amountSpent <= 0 && currentPrice <= 0 && currentValue <= 0) {
      continue;
    }

    // Auto-compute currentPrice from currentValue if currentPrice is not explicitly provided
    if ((!currentPrice || currentPrice <= 0) && currentValue > 0 && shares > 0) {
      currentPrice = currentValue / shares;
    }

    // Auto-compute missing values
    if (!amountSpent || amountSpent <= 0) {
      if (shares > 0 && (buyPrice > 0 || currentPrice > 0)) {
        amountSpent = shares * (buyPrice || currentPrice);
      }
    }
    if (!buyPrice || buyPrice <= 0) {
      if (shares > 0 && amountSpent > 0) {
        buyPrice = amountSpent / shares;
      }
    }
    if (!currentPrice || currentPrice <= 0) {
      currentPrice = buyPrice || 0;
    }

    let symbol = rawSymbol.toUpperCase();
    let name = rawName || rawSymbol;
    let market = rawMarket === "NGX" || rawMarket === "US" ? rawMarket : currentMarket;

    // Check popular name to ticker dictionary
    const lowerName = name.toLowerCase().trim();
    if (POPULAR_NAME_TO_TICKER[lowerName]) {
      symbol = POPULAR_NAME_TO_TICKER[lowerName].symbol;
      market = market || POPULAR_NAME_TO_TICKER[lowerName].market;
    } else if (!symbol && /^[A-Z0-9]{1,8}$/.test(name)) {
      symbol = name.toUpperCase();
    }

    if (!market) {
      market = detectMarket(symbol || name);
    }

    const baseCurrency = rawCurrency || (market === "NGX" ? "NGN" : "USD");

    // Deduplicate repeated snapshot rows in the same spreadsheet
    const dedupKey = [market, symbol || name, shares.toFixed(6), amountSpent.toFixed(2)].join("|");
    if (seenKey.has(dedupKey)) {
      continue;
    }
    seenKey.add(dedupKey);

    results.push({
      id: `parsed-${Date.now()}-${rowIndex}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      symbol,
      market,
      amount: shares || 1,
      buyPrice: parseFloat(buyPrice.toFixed(4)),
      currentPrice: parseFloat(currentPrice.toFixed(4)),
      amountSpent: parseFloat(amountSpent.toFixed(2)),
      baseCurrency,
      selected: true,
      priceSource: "file",
      priceUpdatedAt: new Date().toISOString(),
    });
  }

  return results;
};

/**
 * Scans a 2D array of rows for broker or dollar exchange rates (e.g. "DOLLAR RATE BAMBOO 1,384.00")
 */
export const detectExchangeRateInRows = (rows) => {
  if (!rows || !Array.isArray(rows)) return null;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const cellStr = String(row[c] || "").toLowerCase().trim();
      if (
        cellStr.includes("dollar rate") ||
        cellStr.includes("rate bamboo") ||
        cellStr.includes("bamboo rate") ||
        cellStr.includes("exchange rate") ||
        cellStr.includes("usd rate") ||
        cellStr.includes("usd/ngn") ||
        cellStr.includes("usd to ngn")
      ) {
        // Look in subsequent columns of the same row
        for (let nextCol = c + 1; nextCol < Math.min(row.length, c + 5); nextCol++) {
          const val = cleanNumber(row[nextCol]);
          if (val >= 400 && val <= 10000) {
            return val;
          }
        }
        // Look in the row directly below
        if (r + 1 < rows.length && Array.isArray(rows[r + 1])) {
          const valBelow = cleanNumber(rows[r + 1][c]);
          if (valBelow >= 400 && valBelow <= 10000) {
            return valBelow;
          }
        }
      }
    }
  }

  return null;
};

/**
 * Parses Excel (.xlsx, .xls) and CSV (.csv) files, scanning all worksheets
 */
export const parseSpreadsheetFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("No worksheets found in the file.");
  }

  const allResults = [];
  let detectedExchangeRate = null;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    if (!rows || rows.length === 0) continue;

    if (!detectedExchangeRate) {
      const rateFound = detectExchangeRateInRows(rows);
      if (rateFound) {
        detectedExchangeRate = rateFound;
        setCustomExchangeRate("NGN", rateFound);
      }
    }

    let defaultMarket = "";
    const normSheet = normalizeHeader(sheetName);
    if (normSheet.includes("us") || normSheet.includes("foreign") || normSheet.includes("america")) {
      defaultMarket = "US";
    } else if (normSheet.includes("ngx") || normSheet.includes("nigeria") || normSheet.includes("local")) {
      defaultMarket = "NGX";
    }

    const sheetEntries = parseRowsArray(rows, defaultMarket);
    allResults.push(...sheetEntries);
  }

  if (allResults.length === 0) {
    throw new Error(
      "Could not find any valid stock entries in the spreadsheet. Please check the file headers."
    );
  }

  if (detectedExchangeRate) {
    allResults.forEach((entry) => {
      entry.detectedExchangeRate = detectedExchangeRate;
    });
  }

  return allResults;
};

/**
 * Extracts line text and tabular structures from a PDF statement
 */
export const parsePdfFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDocument = await loadingTask.promise;

  const allLines = [];

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by roughly identical Y coordinates to construct visual lines
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === "") continue;
      const yKey = Math.round(item.transform[5] / 3) * 3;
      if (!lineMap.has(yKey)) {
        lineMap.set(yKey, []);
      }
      lineMap.get(yKey).push({
        text: item.str.trim(),
        x: item.transform[4],
      });
    }

    // Sort lines from top to bottom
    const sortedYKeys = Array.from(lineMap.keys()).sort((a, b) => b - a);

    for (const y of sortedYKeys) {
      const chunks = lineMap.get(y).sort((a, b) => a.x - b.x);
      const lineText = chunks.map((c) => c.text).join(" ");
      allLines.push(lineText);
    }
  }

  if (allLines.length === 0) {
    throw new Error("No readable text content found in the PDF file.");
  }

  // Parse lines into candidate stock rows
  const parsedRows = [];
  const seenKey = new Set();

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    if (
      /total|portfolio value|account summary|statement period|page \d+|disclaimer|terms/i.test(
        line
      )
    ) {
      continue;
    }

    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length < 3) continue;

    // Find numbers in the line
    const numericIndices = [];
    tokens.forEach((token, idx) => {
      const cleaned = token.replace(/[$₦,]/g, "");
      if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
        numericIndices.push(idx);
      }
    });

    if (numericIndices.length >= 2 && numericIndices[0] > 0) {
      const textParts = tokens.slice(0, numericIndices[0]);
      const numbers = numericIndices.map((idx) => cleanNumber(tokens[idx]));

      let symbol = "";
      let name = textParts.join(" ");

      if (/^[A-Z0-9]{1,8}$/.test(textParts[0])) {
        symbol = textParts[0];
        name = textParts.length > 1 ? textParts.slice(1).join(" ") : symbol;
      }

      const lowerName = name.toLowerCase().trim();
      if (POPULAR_NAME_TO_TICKER[lowerName]) {
        symbol = POPULAR_NAME_TO_TICKER[lowerName].symbol;
      }

      let shares = numbers[0];
      let price = numbers[1];
      let total = numbers.length >= 3 ? numbers[2] : shares * price;

      if (shares <= 0 && total > 0) {
        shares = total;
        total = 0;
      }

      if (shares > 0) {
        const market = detectMarket(symbol || name);
        const baseCurrency = market === "NGX" ? "NGN" : "USD";
        const dedupKey = [market, symbol || name, shares.toFixed(4)].join("|");

        if (!seenKey.has(dedupKey)) {
          seenKey.add(dedupKey);
          parsedRows.push({
            id: `pdf-parsed-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            name: name || symbol,
            symbol: symbol || "",
            market,
            amount: shares,
            buyPrice: price > 0 ? parseFloat(price.toFixed(4)) : 0,
            currentPrice: price > 0 ? parseFloat(price.toFixed(4)) : 0,
            amountSpent:
              total > 0
                ? parseFloat(total.toFixed(2))
                : parseFloat((shares * price).toFixed(2)),
            baseCurrency,
            selected: true,
            priceSource: "pdf-statement",
            priceUpdatedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  if (parsedRows.length === 0) {
    throw new Error(
      "Could not automatically detect stock tables from this PDF. Please try an Excel (.xlsx) or CSV file."
    );
  }

  return parsedRows;
};

/**
 * Universal file parser dispatcher
 */
export const parsePortfolioFile = async (file) => {
  if (!file) {
    throw new Error("No file selected.");
  }

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
    return parseSpreadsheetFile(file);
  }

  if (fileName.endsWith(".pdf")) {
    return parsePdfFile(file);
  }

  throw new Error("Unsupported file type. Please upload an Excel (.xlsx, .xls), CSV (.csv), or PDF (.pdf) file.");
};

/**
 * Enriches parsed stock entries with live quotes from Finnhub or NGX Pulse
 */
export const enrichPortfolioPrices = async (entries, onProgress) => {
  const updatedEntries = [...entries];

  for (let i = 0; i < updatedEntries.length; i++) {
    const entry = updatedEntries[i];
    if (!entry.selected) continue;

    if (onProgress) {
      onProgress(i + 1, updatedEntries.length, entry.name || entry.symbol);
    }

    try {
      const query = entry.symbol || entry.name;
      const matched = await searchStock(query);

      if (matched && matched.symbol) {
        const quote = await getStockPrice(matched.symbol, matched.market, { force: true });
        if (quote.source === "reference-index" && entry.currentPrice && Number(entry.currentPrice) > 0) {
          continue;
        }
        updatedEntries[i] = {
          ...entry,
          symbol: matched.symbol,
          market: matched.market || entry.market,
          currentPrice: quote.price || entry.currentPrice,
          priceUpdatedAt: quote.updatedAt || new Date().toISOString(),
          priceSource: quote.source || "market-api",
          priceError: quote.error || "",
        };
      }
    } catch {
      // Keep existing price if lookup fails
    }
  }

  return updatedEntries;
};

/**
 * Generates and downloads a sample spreadsheet template
 */
export const downloadSampleTemplate = (type = "xlsx") => {
  const sampleData = [
    {
      "Stock Name": "Apple Inc",
      "Symbol": "AAPL",
      "Market": "US",
      "Shares": 10,
      "Purchase Price": 180.5,
      "Current Price": 225.0,
      "Amount Spent": 1805.0,
      Currency: "USD",
    },
    {
      "Stock Name": "MTN Nigeria",
      "Symbol": "MTNN",
      "Market": "NGX",
      "Shares": 500,
      "Purchase Price": 230.0,
      "Current Price": 260.0,
      "Amount Spent": 115000.0,
      Currency: "NGN",
    },
    {
      "Stock Name": "Tesla Inc",
      "Symbol": "TSLA",
      "Market": "US",
      "Shares": 5,
      "Purchase Price": 210.0,
      "Current Price": 248.0,
      "Amount Spent": 1050.0,
      Currency: "USD",
    },
    {
      "Stock Name": "Dangote Cement",
      "Symbol": "DANGCEM",
      "Market": "NGX",
      "Shares": 200,
      "Purchase Price": 650.0,
      "Current Price": 700.0,
      "Amount Spent": 130000.0,
      Currency: "NGN",
    },
  ];

  if (type === "csv") {
    const headers = Object.keys(sampleData[0]).join(",");
    const rows = sampleData.map((row) =>
      Object.values(row)
        .map((val) => (typeof val === "string" && val.includes(",") ? `"${val}"` : val))
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "save_my_way_portfolio_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Portfolio");
    XLSX.writeFile(wb, "save_my_way_portfolio_template.xlsx");
  }
};
