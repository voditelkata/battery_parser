export interface ProductDetails {
  name: string;
  productCode: string;
}

export interface ProductBase {
  '#': string;
  'Наименование': string;
  'Остаток': string;
  'Рекомендованная цена': string;
  'Базовая цена': string;
  'Скидка': string;
  'Цена': string;
  'Размеры': string;
  'Пуск.ток': string;
}

export interface Product extends ProductBase {
  Артикул: string;
}
export interface ProductWithLink extends ProductBase {
  link: string;
}
