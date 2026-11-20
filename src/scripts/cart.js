
import products from '../data/products.json';
import {
  CART_STORAGE_KEY,
  getCartItems,
  getCartCount,
  saveCart,
} from '../lib/cart.js';

import { getCartTotals } from '../lib/pricing.js';

function formatPrice(price) {
  return '₹' + Number(price).toLocaleString('en-IN');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('is-visible');

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2200);
}

function updateBadge() {
  const badge = document.getElementById('cart-count');

  if (badge) {
    badge.textContent = String(getCartCount());
  }
}

function add(productId, quantity = 1) {
  const product = products.find(
    (item) => String(item.id) === String(productId)
  );

  const amount = Number(quantity);

  if (
    !product ||
    !Number.isSafeInteger(amount) ||
    amount < 1 ||
    amount > 99
  ) {
    return;
  }

  const cart = getCartItems();
  const existing = cart.find(
    (item) => String(item.id) === String(productId)
  );

  if (existing) {
    if (existing.qty + amount > 99) {
      showToast('Maximum quantity is 99');
      return;
    }

    existing.qty += amount;
  } else {
    cart.push({
      id: product.id,
      qty: amount,
    });
  }

  saveCart(cart);
  showToast('Added to cart');
}

function setQuantity(productId, quantity) {
  const amount = Number(quantity);
  const cart = getCartItems();

  const item = cart.find(
    (entry) => String(entry.id) === String(productId)
  );

  if (!item) return;

  if (amount < 1) {
    remove(productId);
    return;
  }

  if (!Number.isSafeInteger(amount) || amount > 99) {
    showToast('Maximum quantity is 99');
    return;
  }

  item.qty = amount;
  saveCart(cart);
}

function remove(productId) {
  const cart = getCartItems().filter(
    (item) => String(item.id) !== String(productId)
  );

  saveCart(cart);
  showToast('Item removed');
}

function clear() {
  saveCart([]);
  showToast('Cart cleared');
}

function renderCartPage() {
  const root = document.getElementById('cart-root');
  if (!root) return;

  const cart = getCartItems();
  const clearButton = document.getElementById('clear-cart');

  if (clearButton) {
    clearButton.classList.toggle('hidden', cart.length === 0);
  }

  if (cart.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <h2>Your cart is empty</h2>
        <p class="muted">Looks like you have not added anything yet.</p>
        <a class="btn" href="/products">Continue shopping</a>
      </div>
    `;
    return;
  }

  // All cart pricing comes from the shared pricing module.
  const totals = getCartTotals(cart);

  const { subtotal, shipping, total, remainingForFreeShipping } = totals;

  const shippingNote = shipping === 0
    ? 'You have unlocked free shipping.'
    : `Add ${formatPrice(remainingForFreeShipping)} more for free shipping.`;

  root.innerHTML = `
    <div class="cart-layout">
      <div class="cart-list">
        ${cart.map((item) => `
          <div class="cart-item">
            <img
              src="${escapeHtml(item.image)}"
              alt="${escapeHtml(item.name)}"
            />

            <div>
              <h3>
                <a href="/products/${escapeHtml(item.id)}">
                  ${escapeHtml(item.name)}
                </a>
              </h3>

              <p class="muted">${formatPrice(item.price)} each</p>

              <div class="cart-stepper" role="group" aria-label="Quantity for ${escapeHtml(item.name)}">
                <button
                  type="button"
                  data-cart-qty="${escapeHtml(item.id)}"
                  data-delta="-1"
                  aria-label="Decrease quantity"
                >−</button>

                <span>${item.qty}</span>

                <button
                  type="button"
                  data-cart-qty="${escapeHtml(item.id)}"
                  data-delta="1"
                  aria-label="Increase quantity"
                >+</button>
              </div>
            </div>

            <div class="cart-item__side">
              <p class="line-total">
                ${formatPrice(item.price * item.qty)}
              </p>

              <button
                class="icon-btn"
                type="button"
                data-cart-remove="${escapeHtml(item.id)}"
                aria-label="Remove ${escapeHtml(item.name)}"
              >🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>

      <aside class="summary-card">
        <h2>Order summary</h2>

        <div class="summary-row">
          <span>Subtotal</span>
          <strong>${formatPrice(subtotal)}</strong>
        </div>

        <div class="summary-row">
          <span>Shipping (estimate)</span>
          <strong>${shipping === 0 ? 'Free' : formatPrice(shipping)}</strong>
        </div>

        <p class="summary-note">${shippingNote}</p>

        <div class="summary-row summary-total">
          <span>Total</span>
          <span>${formatPrice(total)}</span>
        </div>

        <button class="btn" id="checkout-btn" type="button">
          Checkout
        </button>
      </aside>
    </div>
  `;
}

function initFilters() {
  const search = document.getElementById('product-search');
  const chips = document.getElementById('category-chips');
  const catalog = document.getElementById('catalog');
  const empty = document.getElementById('no-products');
  const heading = document.getElementById('products-heading');

  if (!search || !chips || !catalog || !empty) return;

  const params = new URLSearchParams(window.location.search);
  const validCategories = [
    'All',
    'Electronics',
    'Fashion',
    'Accessories',
  ];

  let category = params.get('category') || 'All';

  if (!validCategories.includes(category)) {
    category = 'All';
  }

  function apply() {
    const query = search.value.trim().toLowerCase();

    chips.querySelectorAll('[data-filter]').forEach((chip) => {
      chip.classList.toggle(
        'is-active',
        chip.getAttribute('data-filter') === category
      );
    });

    if (heading) {
      heading.textContent = category === 'All'
        ? 'All products'
        : category;
    }

    let visible = 0;

    catalog.querySelectorAll('.product-card').forEach((card) => {
      const name = (
        card.getAttribute('data-name') || ''
      ).toLowerCase();

      const cardCategory =
        card.getAttribute('data-category') || '';

      const matchesCategory =
        category === 'All' || cardCategory === category;

      const matchesSearch =
        !query || name.includes(query);

      const show = matchesCategory && matchesSearch;

      card.classList.toggle('hidden', !show);

      if (show) visible += 1;
    });

    empty.classList.toggle('hidden', visible !== 0);
    catalog.classList.toggle('hidden', visible === 0);
  }

  chips.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-filter]');
    if (!chip) return;

    category = chip.getAttribute('data-filter') || 'All';
    apply();
  });

  search.addEventListener('input', apply);
  apply();
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const addButton = target.closest('[data-add]');

  if (addButton) {
    const quantityElement = document.getElementById('qty-value');
    const quantity = quantityElement
      ? Number(quantityElement.textContent) || 1
      : 1;

    add(addButton.getAttribute('data-add'), quantity);
  }

  const stepButton = target.closest('[data-qty-step]');

  if (stepButton) {
    const quantityElement = document.getElementById('qty-value');

    if (quantityElement) {
      const current = Number(quantityElement.textContent) || 1;
      const delta = Number(
        stepButton.getAttribute('data-qty-step')
      );

      quantityElement.textContent = String(
        Math.min(99, Math.max(1, current + delta))
      );
    }
  }

  const cartQuantityButton = target.closest('[data-cart-qty]');

  if (cartQuantityButton) {
    const id = cartQuantityButton.getAttribute('data-cart-qty');
    const item = getCartItems().find(
      (entry) => String(entry.id) === String(id)
    );

    if (item) {
      setQuantity(
        id,
        item.qty + Number(
          cartQuantityButton.getAttribute('data-delta')
        )
      );
    }
  }

  const removeButton = target.closest('[data-cart-remove]');

  if (removeButton) {
    remove(removeButton.getAttribute('data-cart-remove'));
  }

  if (target.closest('#clear-cart')) {
    clear();
  }

  if (target.closest('#checkout-btn')) {
    window.location.href = '/checkout';
  }
});

document.addEventListener('cart:change', () => {
  updateBadge();
  renderCartPage();
});

window.addEventListener('storage', (event) => {
  if (
    event.key === CART_STORAGE_KEY ||
    event.key === 'cart'
  ) {
    updateBadge();
    renderCartPage();
  }
});

function init() {
  updateBadge();
  renderCartPage();
  initFilters();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.showToast = showToast;
window.formatPrice = formatPrice;
window.ShopCart = {
  get: getCartItems,
  add,
  setQuantity,
  remove,
  clear,
  count: getCartCount,
};
