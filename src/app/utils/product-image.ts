import { Product } from '../core/models';

/**
 * Imagen para mostrar de un producto.
 * Si el producto tiene una foto cargada (URL completa o ruta que empieza con "/"), se usa esa.
 * Si no, se elige una ilustración según el nombre.
 */
export function productImage(product: Pick<Product, 'name' | 'image'>): string {
  const image = product.image?.trim();

  if (image && (image.startsWith('http') || image.startsWith('/'))) {
    return image;
  }

  const name = product.name.toLowerCase();
  const has = (text: string) => name.includes(text);

  if (has('porton') || has('portón')) {
    return has('levadiz') ? '/products/porton-levadizo.svg' : '/products/porton-hierro.svg';
  }

  if (has('puerta')) {
    return has('madera') ? '/products/puerta-madera.svg' : '/products/puerta-aluminio.svg';
  }

  return has('pvc') ? '/products/ventana-pvc.svg' : '/products/ventana-aluminio.svg';
}
