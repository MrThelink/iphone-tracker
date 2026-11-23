export type ModelId = '17-pro-max' | '18-pro-max';
export type StorageOption = '256' | '512';
export type StoreId = 'telia' | 'dna' | 'elisa';

export interface StoreOffer {
  store: StoreId;
  storeName: string;
  installmentMonths: number; // Telia 48 kk, DNA 36 kk, Elisa 36 kk
  url: string;
  price: number | null;
  originalPrice: number | null;
  monthlyPrice: number | null;
  discountPercent: number | null;
  inStock: boolean | null;
  isLowest: boolean;
  note?: string;
  status: 'ok' | 'unavailable' | 'error';
  errorMessage?: string;
}

export interface VariantResult {
  model: ModelId;
  modelName: string;
  storage: StorageOption;
  offers: StoreOffer[];
  bestOffer: StoreOffer | null;
}

export interface PricesResponse {
  updatedAt: string;
  variants: VariantResult[];
}