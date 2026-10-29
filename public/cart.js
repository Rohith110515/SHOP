const STORAGE_KEY = 'astro-shop-cart';
const FREE_SHIPPING_MIN = 999;
const SHIPPING_FEE = 99;

function getProducts() {
	const el = document.getElementById('products-data');
	if (!el) return [];
	try {
		return JSON.parse(el.textContent || '[]');
	} catch {
		return [];
	}
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/"/g, '&quot;');
}

function get() {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
	} catch {
		return [];
	}
}

function save(cart) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
	updateBadge();
	document.dispatchEvent(new CustomEvent('cart:change', { detail: { cart } }));
}

function count() {
	return get().reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

function updateBadge() {
	const el = document.getElementById('cart-count');
	if (el) el.textContent = String(count());
}

function formatPrice(price) {
	return '₹' + Number(price).toLocaleString('en-IN');
}

function showToast(message) {
	const toast = document.getElementById('toast');
	if (!toast) return;
	toast.textContent = message;
	toast.classList.add('is-visible');
	clearTimeout(showToast._timer);
	showToast._timer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function add(productId, qty = 1) {
	const product = getProducts().find((item) => String(item.id) === String(productId));
	if (!product) return;
	const amount = Math.max(1, Number(qty) || 1);
	const cart = get();
	const existing = cart.find((item) => String(item.id) === String(productId));
	if (existing) {
		existing.qty += amount;
	} else {
		cart.push({
			id: product.id,
			name: product.name,
			price: product.price,
			image: product.image,
			qty: amount,
		});
	}
	save(cart);
	showToast('Added to cart');
}

function setQuantity(productId, qty) {
	const next = Number(qty);
	if (next < 1) {
		remove(productId);
		return;
	}
	const cart = get();
	const item = cart.find((entry) => String(entry.id) === String(productId));
	if (!item) return;
	item.qty = next;
	save(cart);
}

function remove(productId) {
	save(get().filter((item) => String(item.id) !== String(productId)));
	showToast('Item removed');
}

function clear() {
	save([]);
	showToast('Cart cleared');
}

function renderCartPage() {
	const root = document.getElementById('cart-root');
	if (!root) return;

	const cart = get();
	const clearBtn = document.getElementById('clear-cart');
	if (clearBtn) clearBtn.classList.toggle('hidden', cart.length === 0);

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

	const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
	const shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
	const remaining = Math.max(0, FREE_SHIPPING_MIN - subtotal);
	const shippingNote =
		shipping === 0
			? 'You have unlocked free shipping.'
			: `Add ${formatPrice(remaining)} more for free shipping.`;

	root.innerHTML = `
		<div class="cart-layout">
			<div class="cart-list">
				${cart
					.map(
						(item) => `
					<div class="cart-item">
						<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />
						<div>
							<h3><a href="/products/${escapeHtml(item.id)}">${escapeHtml(item.name)}</a></h3>
							<p class="muted">${formatPrice(item.price)} each</p>
							<div class="cart-stepper">
								<button type="button" data-cart-qty="${escapeHtml(item.id)}" data-delta="-1" aria-label="Decrease quantity">−</button>
								<span>${item.qty}</span>
								<button type="button" data-cart-qty="${escapeHtml(item.id)}" data-delta="1" aria-label="Increase quantity">+</button>
							</div>
						</div>
						<div class="cart-item__side">
							<p class="line-total">${formatPrice(item.price * item.qty)}</p>
							<button class="icon-btn" type="button" data-cart-remove="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)}">🗑️</button>
						</div>
					</div>
				`,
					)
					.join('')}
			</div>
			<aside class="summary-card">
				<h2>Order summary</h2>
				<div class="summary-row"><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div>
				<div class="summary-row"><span>Shipping</span><strong>${shipping === 0 ? 'Free' : formatPrice(shipping)}</strong></div>
				<p class="summary-note">${shippingNote}</p>
				<div class="summary-row summary-total"><span>Total</span><span>${formatPrice(subtotal + shipping)}</span></div>
				<button class="btn" id="checkout-btn" type="button">Checkout</button>
			</aside>
		</div>
	`;
}

function initFilters() {
	const search = document.getElementById('product-search');
	const chips = document.getElementById('category-chips');
	const catalog = document.getElementById('catalog');
	const empty = document.getElementById('no-products');
	if (!search || !chips || !catalog || !empty) return;

	const params = new URLSearchParams(window.location.search);
	let category = params.get('category') || 'All';
	const valid = ['All', 'Electronics', 'Fashion', 'Accessories'];
	if (!valid.includes(category)) category = 'All';

	function apply() {
		const query = search.value.trim().toLowerCase();
		chips.querySelectorAll('[data-filter]').forEach((chip) => {
			chip.classList.toggle('is-active', chip.getAttribute('data-filter') === category);
		});

		let visible = 0;
		catalog.querySelectorAll('.product-card').forEach((card) => {
			const name = (card.getAttribute('data-name') || '').toLowerCase();
			const cat = card.getAttribute('data-category') || '';
			const matchesCategory = category === 'All' || cat === category;
			const matchesSearch = !query || name.includes(query);
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

function init() {
	updateBadge();
	renderCartPage();
	initFilters();
}

document.addEventListener('click', (event) => {
	const addBtn = event.target.closest('[data-add]');
	if (addBtn) {
		const qtyEl = document.getElementById('qty-value');
		const qty = qtyEl ? Number(qtyEl.textContent) || 1 : 1;
		add(addBtn.getAttribute('data-add'), qty);
	}

	const stepBtn = event.target.closest('[data-qty-step]');
	if (stepBtn) {
		const qtyEl = document.getElementById('qty-value');
		if (qtyEl) {
			const next = Math.max(1, (Number(qtyEl.textContent) || 1) + Number(stepBtn.getAttribute('data-qty-step')));
			qtyEl.textContent = String(next);
		}
	}

	const cartQty = event.target.closest('[data-cart-qty]');
	if (cartQty) {
		const id = cartQty.getAttribute('data-cart-qty');
		const item = get().find((entry) => String(entry.id) === String(id));
		if (item) setQuantity(id, item.qty + Number(cartQty.getAttribute('data-delta')));
	}

	const removeBtn = event.target.closest('[data-cart-remove]');
	if (removeBtn) remove(removeBtn.getAttribute('data-cart-remove'));

	if (event.target.closest('#clear-cart')) clear();
	if (event.target.closest('#checkout-btn')) showToast('Checkout is a demo');
});

document.addEventListener('cart:change', renderCartPage);
window.addEventListener('storage', (event) => {
	if (event.key === STORAGE_KEY) {
		updateBadge();
		document.dispatchEvent(new CustomEvent('cart:change', { detail: { cart: get() } }));
	}
});

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

window.showToast = showToast;
window.formatPrice = formatPrice;
window.ShopCart = { get, add, setQuantity, remove, clear, count };
