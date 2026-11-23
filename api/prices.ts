import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CATALOG } from './_lib/catalog.js';
import { scrapeStore } from './_lib/scraper.js';
import type { PricesResponse, StoreId, StoreOffer, VariantResult } from './_lib/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const forceRefresh = req.query.refresh === '1';

  if (forceRefresh) {
    res.setHeader('Cache-Control', 'no-store');
  } else {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  }

  try {
    const storeIds: StoreId[] = ['telia', 'dna', 'elisa'];

    const variants: VariantResult[] = await Promise.all(
      CATALOG.map(async (entry) => {
        const settled = await Promise.allSettled(
          storeIds.map((storeId) => scrapeStore(storeId, entry.urls[storeId]))
        );

        const offers: StoreOffer[] = settled.map((result, idx) => {
          if (result.status === 'fulfilled') return result.value;
          const storeId = storeIds[idx];
          return {
            store: storeId,
            storeName: storeId.toUpperCase(),
            installmentMonths: storeId === 'telia' ? 48 : 36,
            url: entry.urls[storeId],
            price: null,
            originalPrice: null,
            monthlyPrice: null,
            discountPercent: null,
            inStock: null,
            isLowest: false,
            status: 'error',
            errorMessage: 'Сбой запроса',
          };
        });

        offers.sort((a, b) => {
          if (a.price === null && b.price === null) return 0;
          if (a.price === null) return 1;
          if (b.price === null) return -1;
          return a.price - b.price;
        });

        const validPrices = offers.filter((o) => o.price !== null);
        const minPrice = validPrices.length > 0 ? validPrices[0].price : null;

        if (minPrice !== null) {
          for (const offer of offers) {
            if (offer.price === minPrice) {
              offer.isLowest = true;
            }
          }
        }

        return {
          model: entry.model,
          modelName: entry.modelName,
          storage: entry.storage,
          offers,
          bestOffer: validPrices[0] ?? null,
        };
      })
    );

    const payload: PricesResponse = {
      updatedAt: new Date().toISOString(),
      variants,
    };

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({
      error: 'Не удалось обновить цены',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}