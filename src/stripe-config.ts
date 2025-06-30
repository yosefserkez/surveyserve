export interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const products: Product[] = [
  {
    id: 'prod_SaWL4rwqhbxGVr',
    priceId: 'price_1RfLJCFVyHjkyJeOf9E5Le7w',
    name: 'Survey',
    description: 'Access to create survey links and collect responses',
    mode: 'payment',
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find(product => product.id === id);
}

export function getProductByPriceId(priceId: string): Product | undefined {
  return products.find(product => product.priceId === priceId);
}