
export const FREE_SHIPPING_MIN = 999;
export const STANDARD_SHIPPING_FEE = 99;

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
