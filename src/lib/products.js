const productModules = import.meta.glob('../content/products/*.json', {
  eager: true,
  import: 'default',
});

export const products = Object.values(productModules)
  .map((product) => ({
    ...product,
    image: product.image.replace(
      '../../assets/products/',
      '/images/products/'
    ),
  }))
  .sort((a, b) => Number(a.id) - Number(b.id));

export function getProductById(id) {
  return products.find((product) => product.id === String(id));
}