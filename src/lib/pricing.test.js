
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSubtotal,
  getStandardShipping,
  getCourierShipping,
  getCartTotals,
  getCheckoutTotals,
} from './pricing.js';

test('calculates cart subtotal correctly', () => {
  const items = [
    { price: 499, qty: 2 },
    { price: 299, qty: 1 },
  ];

  assert.equal(getSubtotal(items), 1297);
});

test('charges standard shipping below ₹999', () => {
  assert.equal(getStandardShipping(899), 99);
});

test('provides free shipping at ₹999', () => {
  assert.equal(getStandardShipping(999), 0);
});

test('provides free shipping above ₹999', () => {
  assert.equal(getStandardShipping(1500), 0);
});

test('adds courier surcharge below free shipping threshold', () => {
  assert.equal(getCourierShipping(899, 130, 100), 129);
});

test('adds courier surcharge when standard shipping is free', () => {
  assert.equal(getCourierShipping(1200, 130, 100), 30);
});

test('does not add a negative courier surcharge', () => {
  assert.equal(getCourierShipping(899, 80, 100), 99);
});

test('calculates complete cart totals below ₹999', () => {
  const items = [
    { price: 899, qty: 1 },
  ];

  assert.deepEqual(getCartTotals(items), {
    subtotal: 899,
    shipping: 99,
    total: 998,
    remainingForFreeShipping: 100,
  });
});

test('calculates complete cart totals at ₹999', () => {
  const items = [
    { price: 999, qty: 1 },
  ];

  assert.deepEqual(getCartTotals(items), {
    subtotal: 999,
    shipping: 0,
    total: 999,
    remainingForFreeShipping: 0,
  });
});

test('calculates checkout totals correctly', () => {
  const items = [
    { price: 899, qty: 1 },
  ];

  assert.deepEqual(getCheckoutTotals(items, 129), {
    subtotal: 899,
    shipping: 129,
    total: 1028,
  });
});
