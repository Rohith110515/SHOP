
import products from '../data/products.json';

export const CART_STORAGE_KEY = 'astro-shop-cart';
export const LEGACY_CART_STORAGE_KEY = 'cart';

export const FREE_SHIPPING_MIN = 999;
export const STANDARD_SHIPPING_FEE = 99;

const MAX_ITEM_QUANTITY = 99;

function validQuantity(value) {
  const quantity = Number(value);

  return Number.isSafeInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_ITEM_QUANTITY
    ? quantity
    : 0;
}

export function normalizeCart(raw) {
  const quantities = {};

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (!item || item.id == null) return;

      const quantity = validQuantity(
        item.qty ?? item.quantity
      );

      if (!quantity) return;

      const id = String(item.id);
      const combined = (quantities[id] || 0) + quantity;

      if (combined <= MAX_ITEM_QUANTITY) {
        quantities[id] = combined;
      }
    });
  } else if (raw && typeof raw === 'object') {
    Object.entries(raw).forEach(([id, value]) => {
      const quantity =
        value && typeof value === 'object'
          ? value.qty ?? value.quantity
          : value;

      const valid = validQuantity(quantity);

      if (valid) {
        quantities[String(id)] = valid;
      }
    });
  }

  return quantities;
}

export function readCart() {
  if (typeof localStorage === 'undefined') return {};

  for (const key of [
    CART_STORAGE_KEY,
    LEGACY_CART_STORAGE_KEY,
  ]) {
    try {
      const raw = JSON.parse(localStorage.getItem(key));
      const cart = normalizeCart(raw);

      if (Object.keys(cart).length > 0) {
        return cart;
      }
    } catch {
      // Ignore invalid stored data and try the next key.
    }
  }

  return {};
}

export function getCartItems() {
  const quantities = readCart();

  return Object.entries(quantities)
    .map(([id, qty]) => {
      const product = products.find(
        (item) => String(item.id) === id
      );

      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        category: product.category,
        qty,
      };
    })
    .filter(Boolean);
}

export function saveCart(items) {
  if (typeof localStorage === 'undefined') return;

  const quantities = {};

  (Array.isArray(items) ? items : []).forEach((item) => {
    if (!item || item.id == null) return;

    const quantity = validQuantity(item.qty);

    if (!quantity) return;

    const id = String(item.id);
    const combined = (quantities[id] || 0) + quantity;

    if (combined <= MAX_ITEM_QUANTITY) {
      quantities[id] = combined;
    }
  });

  const cart = Object.entries(quantities).map(
    ([id, qty]) => ({ id, qty })
  );

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  localStorage.removeItem(LEGACY_CART_STORAGE_KEY);

  document.dispatchEvent(
    new CustomEvent('cart:change', {
      detail: { cart },
    })
  );
}

export function getCartCount() {
  return Object.values(readCart()).reduce(
    (total, quantity) => total + quantity,
    0
  );
}

export function getSubtotal(items) {
  return items.reduce(
    (total, item) => total + item.price * item.qty,
    0
  );
}

export function getStandardShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_MIN
    ? 0
    : STANDARD_SHIPPING_FEE;
}

export function getCourierShipping(
  subtotal,
  courierRate,
  standardCourierRate
) {
  const baseShipping = getStandardShipping(subtotal);

  const expressSurcharge = Math.max(
    0,
    Number(courierRate) - Number(standardCourierRate)
  );

  return baseShipping + expressSurcharge;
}

export function getCartTotals(items) {
  const subtotal = getSubtotal(items);
  const shipping = getStandardShipping(subtotal);

  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    remainingForFreeShipping: Math.max(
      0,
      FREE_SHIPPING_MIN - subtotal
    ),
  };
}

export function getCheckoutTotals(items, shipping) {
  const subtotal = getSubtotal(items);
  const fee = shipping == null ? null : Number(shipping);

  return {
    subtotal,
    shipping: fee,
    total: subtotal + (fee ?? 0),
  };
}
