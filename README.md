
# MyShop – Astro E-Commerce Demo

MyShop is a simple e-commerce demonstration website built using Astro. It allows users to browse products, manage a shopping cart, complete a simulated checkout, test payment success and failure scenarios, and track a demo order.

The project focuses on demonstrating e-commerce workflows, frontend development, client-side validation, and modular JavaScript functionality.

## Features

### Product Browsing
- View the available products.
- Browse products by category.
- Search and filter products.
- View individual product details.

### Shopping Cart
- Add products to the cart.
- Increase or decrease product quantities.
- Remove individual products.
- Clear the entire cart.
- View subtotal, shipping charges, and total amount.
- Free standard shipping on orders of ₹999 or above.

### Checkout and Shipping
- Enter delivery details.
- Validate Indian mobile numbers and PIN codes.
- Check demo delivery serviceability.
- Compare available courier options.
- Calculate shipping charges and estimated delivery times.

### Demo Payment
- Simulated payment interface.
- UPI, card, and net banking payment options.
- Card number validation using the Luhn algorithm.
- Expiry date and CVV validation.
- Simulate successful and failed payments.
- Retry failed payments without losing cart items.

### Order Management
- View the order confirmation page.
- View demo order and transaction references.
- Track simulated shipment progress.
- View order status and delivery updates.

> **Note:** This is a frontend demonstration project. Payments are simulated, and shipping functionality uses mock Shiprocket-style services. No real payment is processed, and no actual shipment is booked.

## Technologies Used

- **Astro** – Web framework
- **JavaScript** – Frontend functionality and application logic
- **HTML5** – Page structure
- **CSS3** – Styling and responsive layouts
- **JSON** – Product catalogue data
- **Node.js** – Development environment
- **Node.js Test Runner** – Pricing logic tests

## Project Structure

```text
shop/
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── shipping.js
│
├── src/
│   ├── components/
│   │   └── ProductCard.astro
│   │
│   ├── data/
│   │   └── products.json
│   │
│   ├── layouts/
│   │   └── Layout.astro
│   │
│   ├── lib/
│   │   ├── cart.js
│   │   ├── pricing.js
│   │   └── pricing.test.js
│   │
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├── cart.astro
│   │   ├── checkout.astro
│   │   ├── pay.astro
│   │   ├── order-success.astro
│   │   ├── order-failed.astro
│   │   ├── track.astro
│   │   └── products/
│   │       ├── index.astro
│   │       └── [id].astro
│   │
│   ├── scripts/
│   │   ├── cart.js
│   │   └── demo-pay.js
│   │
│   └── styles/
│       └── global.css
│
├── package.json
└── README.md
```

## Requirements

- Node.js 22.23.4 or later
- npm

## Installation and Setup

Clone the repository or download the project files.

Open the project directory in a terminal:

```bash
cd shop
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the following URL in your browser:

```text
http://localhost:4321
```

## Available Commands

Run these commands from the project root directory.

| Command | Description |
|---|---|
| `npm install` | Installs project dependencies |
| `npm run dev` | Starts the local development server |
| `npm run build` | Generates the production build |
| `npm run preview` | Previews the production build locally |
| `npx astro check` | Checks Astro files for diagnostics |
| `npm test` | Runs the pricing module tests |

## Pricing and Cart Logic

The project uses shared modules to keep cart and pricing calculations consistent.

- `src/lib/cart.js` handles cart storage, quantity validation, and product lookup.
- `src/lib/pricing.js` contains shared subtotal, shipping, and total calculations.
- `src/lib/pricing.test.js` tests the pricing calculations using Node.js's built-in test runner.

The cart uses browser local storage to retain cart items between page visits.

## Testing

Run the pricing tests:

```bash
npm test
```

The tests cover:

- Cart subtotal calculations.
- Standard shipping below the free-shipping threshold.
- Free shipping at and above ₹999.
- Courier surcharges.
- Cart total calculations.
- Checkout total calculations.

Run the Astro diagnostics:

```bash
npx astro check
```

Generate the production build:

```bash
npm run build
```

## Demo Limitations

- Payments are simulated and do not involve a real payment gateway.
- Shipping and tracking are simulated using local demo logic.
- Cart information is stored in browser local storage.
- No real customer payment or shipment is processed.

## Future Improvements

- Integrate a real payment gateway.
- Connect a backend API and database.
- Integrate an actual shipping service.
- Implement user authentication and order history.
- Add automated end-to-end testing.

---

**MyShop – A frontend e-commerce demonstration project built with Astro.**
