import * as cheerio from 'cheerio';
import { StoreId, StoreOffer } from './types';
import { STORES } from './catalog';

const MIN_VALID_PRICE = 800;
const MAX_VALID_PRICE = 2800;

function parseEuroNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw >= MIN_VALID_PRICE && raw <= MAX_VALID_PRICE ? Math.round(raw) : null;
  }
  if (typeof raw !== 'string') return null;

  const cleaned = raw
    .replace(/\u00a0/g, ' ')
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');

  const value = parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;
  return value >= MIN_VALID_PRICE && value <= MAX_VALID_PRICE ? Math.round(value) : null;
}

interface ExtractedData {
  price: number | null;
  originalPrice: number | null;
  inStock: boolean | null;
}

function extractFromJsonLd($: cheerio.CheerioAPI): ExtractedData {
  let price: number | null = null;
  let originalPrice: number | null = null;
  let inStock: boolean | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).text().trim();
      if (!text) return;
      const parsed = JSON.parse(text);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];

      for (const node of nodes) {
        const graph = Array.isArray(node?.['@graph']) ? node['@graph'] : [node];
        for (const item of graph) {
          if (!item || typeof item !== 'object') continue;
          const offers = item.offers
            ? Array.isArray(item.offers)
              ? item.offers
              : [item.offers]
            : [];

          for (const offer of offers) {
            const candidate =
              parseEuroNumber(offer.price) ?? parseEuroNumber(offer.lowPrice);
            const highCandidate = parseEuroNumber(offer.highPrice);

            if (candidate !== null && (price === null || candidate < price)) {
              price = candidate;
            }
            if (highCandidate !== null && price !== null && highCandidate > price) {
              originalPrice = highCandidate;
            }
            if (typeof offer.availability === 'string') {
              const av = offer.availability.toLowerCase();
              if (av.includes('instock')) inStock = true;
              else if (av.includes('outofstock') || av.includes('soldout')) {
                inStock = inStock ?? false;
              }
            }
          }
        }
      }
    } catch {
      // Игнорируем невалидные JSON-LD блоки
    }
  });

  return { price, originalPrice, inStock };
}

function extractFromMeta($: cheerio.CheerioAPI): number | null {
  const selectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[name="price"]',
    '[itemprop="price"]',
  ];

  for (const selector of selectors) {
    const el = $(selector).first();
    const raw = el.attr('content') || el.text();
    const parsed = parseEuroNumber(raw);
    if (parsed !== null) return parsed;
  }
  return null;
}

function extractFromNextData($: cheerio.CheerioAPI): ExtractedData {
  const raw = $('script#__NEXT_DATA__').text();
  if (!raw) return { price: null, originalPrice: null, inStock: null };

  const foundPrices: number[] = [];
  const priceKeyRegex =
    /"(?:price|salesPrice|campaignPrice|currentPrice|totalPrice|cashPrice)"\s*:\s*"?(\d{3,4}(?:[.,]\d{1,2})?)"?/gi;
  let match: RegExpExecArray | null;

  while ((match = priceKeyRegex.exec(raw)) !== null) {
    const val = parseEuroNumber(match[1]);
    if (val !== null) foundPrices.push(val);
  }

  const normalPrices: number[] = [];
  const normalKeyRegex =
    /"(?:normalPrice|originalPrice|regularPrice|listPrice|recommendedPrice|suositushinta)"\s*:\s*"?(\d{3,4}(?:[.,]\d{1,2})?)"?/gi;

  while ((match = normalKeyRegex.exec(raw)) !== null) {
    const val = parseEuroNumber(match[1]);
    if (val !== null) normalPrices.push(val);
  }

  const price = foundPrices.length > 0 ? Math.min(...foundPrices) : null;
  const maxNormal = normalPrices.length > 0 ? Math.max(...normalPrices) : null;
  const originalPrice =
    price !== null && maxNormal !== null && maxNormal > price ? maxNormal : null;

  return { price, originalPrice, inStock: null };
}

function extractFromVisibleText($: cheerio.CheerioAPI): ExtractedData {
  // Убираем скрипты и стили, чтобы искать по чистому тексту страницы
  const clone = cheerio.load($.html());
  clone('script, style, noscript').remove();
  const text = clone('body').text().replace(/\u00a0/g, ' ');

  // Ищем цены вида "1 499 €", "1499,00 €", исключая "/kk"
  const regex = /(\d\s?\d{3}(?:[.,]\d{2})?)\s*€(?!\s*\/\s*kk)/gi;
  const matches: number[] = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    const val = parseEuroNumber(m[1]);
    if (val !== null) matches.push(val);
  }

  if (matches.length === 0) return { price: null, originalPrice: null, inStock: null };

  const unique = Array.from(new Set(matches)).sort((a, b) => a - b);
  const price = unique[0];
  const originalPrice =
    unique.length > 1 && unique[unique.length - 1] - price <= 400
      ? unique[unique.length - 1]
      : null;

  const lower = text.toLowerCase();
  let inStock: boolean | null = null;
  if (
    lower.includes('varastossa') ||
    lower.includes('lisää ostoskoriin') ||
    lower.includes('heti toimitukseen')
  ) {
    inStock = true;
  } else if (lower.includes('loppuunmyyty') || lower.includes('ei varastossa')) {
    inStock = false;
  }

  return { price, originalPrice, inStock };
}

export async function scrapeStore(storeId: StoreId, url: string): Promise<StoreOffer> {
  const storeCfg = STORES[storeId];

  const baseOffer: StoreOffer = {
    store: storeId,
    storeName: storeCfg.name,
    installmentMonths: storeCfg.installmentMonths,
    url,
    price: null,
    originalPrice: null,
    monthlyPrice: null,
    discountPercent: null,
    inStock: null,
    isLowest: false,
    note: storeCfg.note,
    status: 'error',
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        ...baseOffer,
        status: response.status === 404 ? 'unavailable' : 'error',
        errorMessage: `HTTP ${response.status} — проверь ссылку в catalog.ts`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const jsonLd = extractFromJsonLd($);
    const nextData = extractFromNextData($);
    const metaPrice = extractFromMeta($);
    const fallback = extractFromVisibleText($);

    const price = jsonLd.price ?? nextData.price ?? metaPrice ?? fallback.price;
    const originalPrice =
      jsonLd.originalPrice ?? nextData.originalPrice ?? fallback.originalPrice;
    const inStock = jsonLd.inStock ?? fallback.inStock;

    if (price === null) {
      return {
        ...baseOffer,
        status: 'unavailable',
        errorMessage: 'Цена не найдена в HTML (возможно, страница грузится через JS API)',
      };
    }

    const validOriginal =
      originalPrice !== null && originalPrice > price ? originalPrice : null;

    const discountPercent = validOriginal
      ? Math.round(((validOriginal - price) / validOriginal) * 100)
      : null;

    const monthlyPrice = Number((price / storeCfg.installmentMonths).toFixed(2));

    return {
      ...baseOffer,
      price,
      originalPrice: validOriginal,
      monthlyPrice,
      discountPercent,
      inStock,
      status: 'ok',
    };
  } catch (err) {
    return {
      ...baseOffer,
      status: 'error',
      errorMessage: err instanceof Error ? err.message : 'Ошибка соединения',
    };
  }
}