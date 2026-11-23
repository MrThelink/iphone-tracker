import { ModelId, StorageOption, StoreId } from './types';

export interface StoreConfig {
  id: StoreId;
  name: string;
  installmentMonths: number;
  note?: string;
}

export const STORES: Record<StoreId, StoreConfig> = {
  telia: {
    id: 'telia',
    name: 'Telia',
    installmentMonths: 48,
    note: 'Проверь цену с Asiakasetu на сайте',
  },
  dna: {
    id: 'dna',
    name: 'DNA',
    installmentMonths: 36,
    note: '0% рассрочка до 36 мес.',
  },
  elisa: {
    id: 'elisa',
    name: 'Elisa',
    installmentMonths: 36,
    note: 'Joustomaksu 0% до 36 мес.',
  },
};

export interface CatalogEntry {
  model: ModelId;
  modelName: string;
  storage: StorageOption;
  urls: Record<StoreId, string>;
}


export const CATALOG: CatalogEntry[] = [
  {
    model: '17-pro-max',
    modelName: 'iPhone 17 Pro Max',
    storage: '256',
    urls: {
      telia: 'https://www.telia.fi/kauppa/tuote/apple-iphone-17-pro-max/mfyn4qn-a',
      dna: 'https://kauppa.dna.fi/tuote/p/apple-iphone-17-pro-max-5g-256-gt-kosminen-oranssi',
      elisa: '',
    },
  },
  {
    model: '17-pro-max',
    modelName: 'iPhone 17 Pro Max',
    storage: '512',
    urls: {
      telia: 'https://www.telia.fi/kauppa/tuote/apple-iphone-17-pro-max/mfyt4qn-a',
      dna: 'https://kauppa.dna.fi/tuote/p/apple-iphone-17-pro-max-5g-512-gt-kosminen-oranssi',
      elisa: 'https://kauppa.dna.fi/tuote/p/apple-iphone-17-pro-max-5g-512-gt-mustansininen',
    },
  },
  {
    model: '18-pro-max',
    modelName: 'iPhone 18 Pro Max',
    storage: '256',
    urls: {
      telia: 'https://www.telia.fi/kauppa/tuote/apple-iphone-18-pro-max/mjxq4qn-a',
      dna: 'https://kauppa.dna.fi/tuote/p/apple-iphone-18-pro-max-5g-256-gt-viininpunainen',
      elisa: 'https://elisa.fi/kauppa/tuote/apple-iphone-18-pro-max-256-gt-5g?deviceVariant=iPhone%2018%20Pro%20Max%20256%20Gt%205G%20Viininpunainen',
    },
  },
  {
    model: '18-pro-max',
    modelName: 'iPhone 18 Pro Max',
    storage: '512',
    urls: {
      telia: 'https://www.telia.fi/kauppa/tuote/apple-iphone-18-pro-max/mjxv4qn-a',
      dna: 'https://kauppa.dna.fi/tuote/p/apple-iphone-18-pro-max-5g-512-gt-viininpunainen',
      elisa: 'https://elisa.fi/kauppa/tuote/apple-iphone-18-pro-max-512-gt-5g?deviceVariant=iPhone%2018%20Pro%20Max%20512%20Gt%205G%20Viininpunainen',
    },
  },
];