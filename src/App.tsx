import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ArrowUpRight, Flame, Smartphone } from 'lucide-react';
import type { ModelId, PricesResponse, StorageOption } from './types';
import { StoreCard } from './components/StoreCard';

export function App() {
  const [selectedModel, setSelectedModel] = useState<ModelId>('17-pro-max');
  const [selectedStorage, setSelectedStorage] = useState<StorageOption>('256');
  const [data, setData] = useState<PricesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch(force ? '/api/prices?refresh=1' : '/api/prices');
      if (!res.ok) throw new Error(`Ошибка сервера (${res.status})`);

      const json: PricesResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось загрузить цены. Проверь, запущен ли проект через vercel dev.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices(false);
  }, [fetchPrices]);

  const activeVariant = useMemo(() => {
    return (
      data?.variants.find(
        (v) => v.model === selectedModel && v.storage === selectedStorage
      ) ?? null
    );
  }, [data, selectedModel, selectedStorage]);

  const bestOffer = activeVariant?.bestOffer ?? null;

  const formattedTime = useMemo(() => {
    if (!data?.updatedAt) return '';
    return new Date(data.updatedAt).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [data?.updatedAt]);

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] selection:bg-[#0071e3]/30">
      {/* Мягкое титановое свечение вверху */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(190,175,155,0.14),transparent_65%)]" />

      {/* Sticky стеклянная шапка */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-black/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[#d4c5b2]" />
            <span className="text-sm font-semibold tracking-tight">
              Pro Max Tracker
            </span>
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-[#a1a1a6]">
              FI · 0%
            </span>
          </div>

          <button
            onClick={() => fetchPrices(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#f5f5f7] transition hover:bg-white/[0.14] active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>{refreshing ? 'Обновляю...' : 'Обновить'}</span>
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-xl px-4 pb-16 pt-6">
        {/* Сегментированный выбор модели */}
        <div className="rounded-2xl bg-[#161617] p-1 ring-1 ring-white/[0.08]">
          <div className="grid grid-cols-2 gap-1">
            {(
              [
                { id: '17-pro-max', label: 'iPhone 17 Pro Max' },
                { id: '18-pro-max', label: 'iPhone 18 Pro Max' },
              ] as const
            ).map((item) => {
              const active = selectedModel === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedModel(item.id)}
                  className={`rounded-xl py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#2c2c2e] text-white shadow-sm'
                      : 'text-[#86868b] hover:text-[#f5f5f7]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Выбор памяти */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {(['256', '512'] as const).map((gb) => {
            const active = selectedStorage === gb;
            return (
              <button
                key={gb}
                onClick={() => setSelectedStorage(gb)}
                className={`rounded-full px-5 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  active
                    ? 'bg-[#f5f5f7] text-black'
                    : 'bg-[#161617] text-[#a1a1a6] ring-1 ring-white/[0.08] hover:text-white'
                }`}
              >
                {gb} ГБ
              </button>
            );
          })}
        </div>

        {/* Hero-секция с самой низкой ценой */}
        <section className="mt-7 overflow-hidden rounded-[32px] bg-gradient-to-b from-[#1a1a1c] via-[#121214] to-[#0a0a0b] p-6 text-center ring-1 ring-white/[0.12]">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-200 ring-1 ring-amber-400/20">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Black Friday · Минимум среди Telia, DNA, Elisa</span>
          </div>

          <h1 className="mt-4 bg-gradient-to-b from-white via-[#f5f5f7] to-[#a89f91] bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
            {selectedModel === '17-pro-max'
              ? 'iPhone 17 Pro Max'
              : 'iPhone 18 Pro Max'}
          </h1>
          <p className="mt-1 text-sm text-[#86868b]">{selectedStorage} ГБ · 0% рассрочка</p>

          {loading ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-4">
              <div className="h-12 w-40 animate-pulse rounded-2xl bg-white/[0.08]" />
              <div className="h-4 w-52 animate-pulse rounded-full bg-white/[0.05]" />
            </div>
          ) : bestOffer && bestOffer.price !== null ? (
            <div className="mt-6">
              <div className="flex items-baseline justify-center gap-3">
                {bestOffer.originalPrice && (
                  <span className="text-xl text-[#6e6e73] line-through tabular-nums">
                    {bestOffer.originalPrice} €
                  </span>
                )}
                <span className="text-5xl font-semibold tracking-tight text-white tabular-nums">
                  {bestOffer.price} €
                </span>
              </div>

              <p className="mt-2 text-sm text-[#a1a1a6] tabular-nums">
                от{' '}
                <span className="font-medium text-white">
                  {bestOffer.monthlyPrice?.toFixed(2).replace('.', ',')} €/мес
                </span>{' '}
                на {bestOffer.installmentMonths} мес. в{' '}
                <span className="font-semibold text-white">
                  {bestOffer.storeName}
                </span>
              </p>

              <a
                href={bestOffer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#0077ed] active:scale-[0.98] sm:w-auto"
              >
                <span>Забрать в {bestOffer.storeName}</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-white/[0.04] p-4 text-xs text-[#86868b]">
              Пока нет данных по этой конфигурации — проверь ссылки в{' '}
              <code className="text-[#f5f5f7]">api/_lib/catalog.ts</code> или
              открой магазины ниже вручную.
            </div>
          )}
        </section>

        {/* Ошибка сети / локального запуска */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Список всех трёх магазинов */}
        <section className="mt-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
              Сравнение операторов
            </h2>
            {formattedTime && (
              <span className="text-[11px] text-[#6e6e73] tabular-nums">
                Обновлено в {formattedTime}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-3xl bg-[#161617] ring-1 ring-white/[0.06]"
                />
              ))}
            </div>
          ) : (
            activeVariant?.offers.map((offer) => (
              <StoreCard key={offer.store} offer={offer} />
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default App;