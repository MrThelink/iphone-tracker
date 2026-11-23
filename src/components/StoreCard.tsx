import { ArrowUpRight, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';
import type { StoreOffer } from '../types';

const STORE_ACCENT: Record<StoreOffer['store'], string> = {
  telia: 'bg-purple-500',
  dna: 'bg-pink-500',
  elisa: 'bg-blue-500',
};

interface StoreCardProps {
  offer: StoreOffer;
}

export function StoreCard({ offer }: StoreCardProps) {
  const isAvailable = offer.status === 'ok' && offer.price !== null;

  return (
    <a
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative block rounded-3xl p-5 transition-all duration-300 active:scale-[0.985] ${
        offer.isLowest
          ? 'bg-gradient-to-b from-[#1d1d1f] to-[#141416] ring-1 ring-white/25 shadow-[0_0_40px_-15px_rgba(255,255,255,0.2)]'
          : 'bg-[#161617] ring-1 ring-white/[0.08] hover:ring-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Левая часть: магазин и статус */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${STORE_ACCENT[offer.store]}`} />
            <h3 className="text-lg font-semibold tracking-tight text-[#f5f5f7]">
              {offer.storeName}
            </h3>
            {offer.isLowest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200 ring-1 ring-amber-200/20">
                <Sparkles className="h-3 w-3" />
                Лучшая цена
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#86868b]">
            {offer.inStock === true && (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />В наличии
              </span>
            )}
            {offer.inStock === false && (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                Нет в наличии
              </span>
            )}
            {offer.note && <span>· {offer.note}</span>}
          </div>
        </div>

        {/* Правая часть: цена */}
        <div className="text-right">
          {isAvailable ? (
            <>
              <div className="flex items-baseline justify-end gap-2">
                {offer.originalPrice && (
                  <span className="text-sm text-[#6e6e73] line-through tabular-nums">
                    {offer.originalPrice} €
                  </span>
                )}
                <span className="text-2xl font-semibold tracking-tight text-[#f5f5f7] tabular-nums">
                  {offer.price} €
                </span>
              </div>

              <div className="mt-1 flex items-center justify-end gap-2">
                {offer.discountPercent && (
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    -{offer.discountPercent}%
                  </span>
                )}
                {offer.monthlyPrice && (
                  <span className="text-xs text-[#86868b] tabular-nums">
                    {offer.monthlyPrice.toFixed(2).replace('.', ',')} €/kk ·{' '}
                    {offer.installmentMonths} kk
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-[#86868b]">
              <AlertCircle className="h-4 w-4 text-amber-400/80" />
              <span>Открыть сайт</span>
            </div>
          )}
        </div>
      </div>

      {!isAvailable && offer.errorMessage && (
        <p className="mt-3 rounded-xl bg-white/[0.03] px-3 py-2 text-[11px] text-[#86868b]">
          {offer.errorMessage}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-[#0071e3] group-hover:text-[#2997ff]">
        <span>Открыть предложение в {offer.storeName}</span>
        <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </a>
  );
}