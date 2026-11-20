
import {
  getCartItems,
  getSubtotal,
  getCourierShipping,
  saveCart,
} from "../lib/cart.js";

(function () {
  "use strict";

  /* ---------- Settings ---------- */
  var ORDER_KEY = "myshop-demo-order";

  var BANKS = [
    "Demo National Bank",
    "Demo Federal Bank",
    "Demo Civic Bank",
    "Demo Union Bank",
    "Demo Metro Bank",
    "Demo Coastal Bank",
  ];

  /* ---------- Helpers ---------- */
  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  function fmt(n) {
    return "\u20B9" + Number(n).toLocaleString("en-IN");
  }

  function setText(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  function randomDigits(n) {
    var s = "";
    while (s.length < n) {
      s += Math.floor(Math.random() * 10);
    }
    return s;
  }

  function newOrderRef() {
    return "MS-" + Date.now().toString(36).toUpperCase() + randomDigits(3);
  }

  function newTxnRef() {
    return "DEMO_TXN_" + randomDigits(12);
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (e) {
      return iso || "";
    }
  }

  function formatDay(iso) {
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch (e) {
      return iso || "";
    }
  }

  function markSteps(ul, activeIndex) {
    if (!ul) return;

    for (var j = 0; j < ul.children.length; j++) {
      ul.children[j].className =
        j < activeIndex
          ? "done"
          : j === activeIndex
            ? "active"
            : "";
    }
  }

  /* ---------- Cart + order storage ---------- */

  function getOrder() {
    try {
      return JSON.parse(localStorage.getItem(ORDER_KEY));
    } catch (e) {
      return null;
    }
  }

  function saveOrder(order) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  }

  function clearCart() {
    // Uses the shared cart module and refreshes the cart badge.
    saveCart([]);
  }

  function validOrder(order) {
    if (
      !order ||
      !Array.isArray(order.items) ||
      order.items.length === 0
    ) {
      return false;
    }

    var subtotal = 0;

    for (var i = 0; i < order.items.length; i++) {
      var item = order.items[i];

      if (
        !item ||
        !Number.isSafeInteger(Number(item.qty)) ||
        Number(item.qty) < 1 ||
        Number(item.qty) > 99 ||
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) <= 0
      ) {
        return false;
      }

      subtotal += Number(item.price) * Number(item.qty);
    }

    return (
      Number.isFinite(subtotal) &&
      subtotal > 0 &&
      Number.isFinite(Number(order.total)) &&
      Number(order.total) > 0 &&
      Number.isFinite(Number(order.shipping)) &&
      Number(order.shipping) >= 0 &&
      Math.abs(Number(order.subtotal) - subtotal) < 0.01 &&
      Math.abs(
        Number(order.total) - (subtotal + Number(order.shipping))
      ) < 0.01
    );
  }

  /* ---------- Shared rendering ---------- */

  function renderItems(el, items) {
    if (!el) return;

    el.innerHTML = items
      .map(function (i) {
        return (
          '<div class="dp-item">' +
          '<img src="' +
          esc(i.image) +
          '" alt="" width="56" height="56" loading="lazy">' +
          '<div class="dp-item-info">' +
          "<strong>" +
          esc(i.name) +
          "</strong>" +
          "<span>Qty " +
          i.qty +
          " \u00D7 " +
          fmt(i.price) +
          "</span>" +
          "</div>" +
          '<span class="dp-item-total">' +
          fmt(i.price * i.qty) +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function fillTotals(t) {
    setText("sum-subtotal", fmt(t.subtotal));

    var ship = $("sum-shipping");

    if (ship) {
      if (t.shipping == null) {
        ship.textContent = "Select delivery option";
        ship.className = "dp-muted";
      } else {
        ship.textContent =
          t.shipping === 0 ? "Free" : fmt(t.shipping);

        ship.className = t.shipping === 0 ? "dp-free" : "";
      }
    }

    setText("sum-total", fmt(t.total));
  }

  /* ---------- Receipt download ---------- */

  function receiptHtml(o) {
    var rows = o.items
      .map(function (i) {
        return (
          "<tr><td>" +
          esc(i.name) +
          "</td><td>" +
          i.qty +
          "</td><td>" +
          fmt(i.price) +
          "</td><td>" +
          fmt(i.price * i.qty) +
          "</td></tr>"
        );
      })
      .join("");

    var shipLine = o.delivery
      ? "<p><strong>Shipping:</strong> " +
        esc(o.delivery.courierName) +
        (o.shipment && o.shipment.awb
          ? " \u00B7 AWB " + esc(o.shipment.awb)
          : "") +
        "</p>"
      : "";

    return (
      "<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Demo receipt " +
      esc(o.orderRef) +
      "</title>" +
      "<style>body{font-family:system-ui,Arial,sans-serif;max-width:640px;margin:2rem auto;padding:0 1rem;color:#0f172a}" +
      "h1{margin:0}.tag{display:inline-block;background:#fef3c7;color:#92400e;padding:.2rem .6rem;border-radius:999px;font-size:.75rem;font-weight:700}" +
      "table{width:100%;border-collapse:collapse;margin:1rem 0}th,td{text-align:left;padding:.5rem;border-bottom:1px solid #e2e8f0}" +
      ".r{display:flex;justify-content:space-between;padding:.25rem 0}.t{font-weight:800;font-size:1.1rem;border-top:2px solid #0f172a;margin-top:.5rem;padding-top:.5rem}" +
      "small{color:#64748b}</style></head><body>" +
      "<h1>MyShop</h1><p><span class='tag'>DEMO RECEIPT</span></p>" +
      "<p><strong>Order:</strong> " +
      esc(o.orderRef) +
      "<br><strong>Transaction:</strong> " +
      esc(o.txnRef) +
      "<br><strong>Date:</strong> " +
      esc(formatDate(o.paidAt)) +
      "<br><strong>Payment method:</strong> " +
      esc(o.methodDetail) +
      "</p>" +
      "<p><strong>Billed to:</strong> " +
      esc(o.customer.name) +
      "<br>" +
      esc(o.customer.address) +
      ", " +
      esc(o.customer.city) +
      (o.customer.state ? ", " + esc(o.customer.state) : "") +
      " - " +
      esc(o.customer.pincode) +
      "<br>" +
      esc(o.customer.email) +
      " | " +
      esc(o.customer.phone) +
      "</p>" +
      shipLine +
      "<table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>" +
      rows +
      "</tbody></table>" +
      "<div class='r'><span>Subtotal</span><span>" +
      fmt(o.subtotal) +
      "</span></div>" +
      "<div class='r'><span>Shipping</span><span>" +
      (o.shipping === 0 ? "Free" : fmt(o.shipping)) +
      "</span></div>" +
      "<div class='r t'><span>Total</span><span>" +
      fmt(o.total) +
      "</span></div>" +
      "<p><small>This is a simulated receipt from a demo payment gateway. No real payment was made and this is not a tax invoice.</small></p>" +
      "</body></html>"
    );
  }

  function downloadReceipt(o) {
    var blob = new Blob([receiptHtml(o)], {
      type: "text/html",
    });

    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");

    a.href = url;
    a.download = "MyShop-Demo-Receipt-" + o.orderRef + ".html";

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /* =====================================================
     PAGE: CHECKOUT
     ===================================================== */

  function initCheckout() {
    var SR = window.ShiprocketDemo;

    // The shared cart module supplies catalogue prices and valid quantities.
    var items = getCartItems();

    if (!items.length) {
      $("checkout-content").hidden = true;
      $("checkout-empty").hidden = false;
      return;
    }

    var subtotal = getSubtotal(items);

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      $("checkout-content").hidden = true;
      $("checkout-empty").hidden = false;
      return;
    }

    var weight = SR.packageWeight(items);
    var delivery = null;

    function refreshTotals() {
      var shipping = delivery ? delivery.fee : null;

      fillTotals({
        subtotal: subtotal,
        shipping: shipping,
        total: subtotal + (shipping || 0),
      });

      setText(
        "pay-label",
        delivery ? "Continue to payment" : "Continue to payment"
      );
    }

    renderItems($("summary-items"), items);
    refreshTotals();

    setText(
      "ship-origin",
      "Ships from " +
        SR.PICKUP.city +
        " (" +
        SR.PICKUP.pincode +
        ") \u00B7 package weight about " +
        weight +
        " kg"
    );

    /* --- Form validation --- */

    var form = $("checkout-form");

    var fields = [
      "name",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "pincode",
    ];

    function cleanPhone(v) {
      var d = v.replace(/\D/g, "");

      if (d.length === 12 && d.indexOf("91") === 0) {
        d = d.slice(2);
      }

      return d;
    }

    var rules = {
      name: function (v) {
        return v.trim().length >= 2
          ? ""
          : "Please enter your full name.";
      },

      email: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
          ? ""
          : "Enter a valid email address.";
      },

      phone: function (v) {
        return /^[6-9]\d{9}$/.test(cleanPhone(v))
          ? ""
          : "Enter a valid 10-digit Indian mobile number.";
      },

      address: function (v) {
        return v.trim().length >= 8
          ? ""
          : "Enter your full street address.";
      },

      city: function (v) {
        return v.trim().length >= 2 ? "" : "Enter your city.";
      },

      state: function (v) {
        return v.trim().length >= 2 ? "" : "Enter your state.";
      },

      pincode: function (v) {
        return /^\d{6}$/.test(v.trim())
          ? ""
          : "Enter a valid 6-digit PIN code.";
      },
    };

    function validate(name) {
      var input = $("f-" + name);
      var msg = rules[name](input.value);

      setText("e-" + name, msg);

      input.classList.toggle("is-invalid", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");

      return !msg;
    }

    /* --- Delivery options --- */

    var checkId = 0;
    var debounce;

    function setShipStatus(html) {
      $("ship-status").innerHTML = html;
    }

    function loadOptions() {
      var pin = $("f-pincode").value.trim();

      delivery = null;
      $("ship-options").innerHTML = "";
      setText("e-delivery", "");

      refreshTotals();

      if (!/^\d{6}$/.test(pin)) {
        setShipStatus(
          "Enter your 6-digit PIN code to see couriers and delivery dates."
        );
        return;
      }

      var id = ++checkId;

      setShipStatus(
        '<span class="ship-spin" aria-hidden="true"></span>Checking couriers for ' +
          esc(pin) +
          "\u2026"
      );

      SR.checkServiceability({
        pickup_postcode: SR.PICKUP.pincode,
        delivery_postcode: pin,
        weight: weight,
        cod: 0,
      })
        .then(function (res) {
          if (id !== checkId) return;

          var list =
            (res.status === 200 &&
              res.data &&
              res.data.available_courier_companies) ||
            [];

          if (!list.length) {
            setShipStatus(
              "\u274C " +
                esc(
                  res.message ||
                    "We can't deliver to this PIN code right now."
                )
            );
            return;
          }

          var validRates = list.filter(function (c) {
            return Number.isFinite(Number(c.rate)) &&
              Number(c.rate) >= 0;
          });

          if (!validRates.length) {
            setShipStatus(
              "\u274C No valid courier rates are available."
            );
            return;
          }

          var cheapest = Math.min.apply(
            null,
            validRates.map(function (c) {
              return Number(c.rate);
            })
          );

          var opts = validRates.map(function (c) {
            return {
              courierId: c.courier_company_id,
              courierName: c.courier_name,
              rate: Number(c.rate),
              cheapestRate: cheapest,

              // Base shipping is ₹99 below ₹999 and free above ₹999.
              // More expensive couriers add only their price difference.
              fee: getCourierShipping(
                subtotal,
                Number(c.rate),
                cheapest
              ),

              days: c.estimated_delivery_days,
              etd: c.etd,
              weight: weight,
              pincode: pin,
            };
          });

          setShipStatus(
            subtotal >= 999
              ? "\u2705 Delivery available. You've unlocked free standard shipping."
              : "\u2705 Delivery available. Choose a courier:"
          );

          var box = $("ship-options");

          box.innerHTML = opts
            .map(function (o, i) {
              return (
                '<label class="ship-opt">' +
                '<input type="radio" name="courier" value="' +
                i +
                '">' +
                '<span class="ship-opt-main">' +
                "<strong>" +
                esc(o.courierName) +
                "</strong>" +
                "<small>Delivery by " +
                esc(formatDay(o.etd)) +
                " \u00B7 " +
                o.days +
                (o.days === 1 ? " day" : " days") +
                "</small>" +
                "</span>" +
                '<span class="ship-opt-price' +
                (o.fee === 0 ? " dp-free" : "") +
                '">' +
                (o.fee === 0 ? "Free" : fmt(o.fee)) +
                "</span>" +
                "</label>"
              );
            })
            .join("");

          var radios = box.querySelectorAll("input");
          var labels = box.querySelectorAll(".ship-opt");

          function pick(i) {
            delivery = opts[i];

            radios[i].checked = true;

            labels.forEach(function (label, k) {
              label.classList.toggle("is-selected", k === i);
            });

            setText("e-delivery", "");
            refreshTotals();
          }

          radios.forEach(function (radio, i) {
            radio.addEventListener("change", function () {
              pick(i);
            });
          });

          // The cheapest courier is selected by default.
          pick(0);
        })
        .catch(function () {
          if (id === checkId) {
            setShipStatus(
              "\u274C Couldn't check delivery. Please try again."
            );
          }
        });
    }

    /* --- Prefill from a previous attempt --- */

    var prev = getOrder();

    if (prev && prev.customer) {
      fields.forEach(function (f) {
        if (prev.customer[f]) {
          $("f-" + f).value = prev.customer[f];
        }
      });
    }

    fields.forEach(function (f) {
      $("f-" + f).addEventListener("blur", function () {
        validate(f);
      });

      $("f-" + f).addEventListener("input", function () {
        if ($("f-" + f).classList.contains("is-invalid")) {
          validate(f);
        }
      });
    });

    $("f-pincode").addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(loadOptions, 350);
    });

    loadOptions();

    /* --- Submit --- */

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var allOk = true;
      var firstBad = null;

      fields.forEach(function (f) {
        if (!validate(f)) {
          allOk = false;
          if (!firstBad) firstBad = f;
        }
      });

      if (!allOk) {
        $("f-" + firstBad).focus();
        return;
      }

      if (!delivery) {
        setText("e-delivery", "Please choose a delivery option.");

        $("ship-box").scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        return;
      }

      if (delivery.pincode !== $("f-pincode").value.trim()) {
        setText(
          "e-delivery",
          "Please wait for the courier options for your current PIN code."
        );
        return;
      }

      // Read the cart again before creating the order.
      // This prevents stale prices or invalid quantities from being used.
      var latestItems = getCartItems();
      var latestSubtotal = getSubtotal(latestItems);

      if (
        !latestItems.length ||
        !Number.isFinite(latestSubtotal) ||
        latestSubtotal <= 0
      ) {
        $("checkout-content").hidden = true;
        $("checkout-empty").hidden = false;
        return;
      }

      var latestShipping = getCourierShipping(
        latestSubtotal,
        delivery.rate,
        delivery.cheapestRate
      );

      var btn = $("pay-submit");

      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");

      var order = {
        orderRef: newOrderRef(),
        status: "pending",
        createdAt: new Date().toISOString(),

        customer: {
          name: $("f-name").value.trim(),
          email: $("f-email").value.trim(),
          phone: cleanPhone($("f-phone").value),
          address: $("f-address").value.trim(),
          city: $("f-city").value.trim(),
          state: $("f-state").value.trim(),
          pincode: $("f-pincode").value.trim(),
        },

        items: latestItems,
        subtotal: latestSubtotal,
        shipping: latestShipping,
        total: latestSubtotal + latestShipping,

        delivery: {
          ...delivery,
          fee: latestShipping,
        },
      };

      saveOrder(order);

      setTimeout(function () {
        location.href = "/pay";
      }, 600);
    });
  }

  /* =====================================================
     PAGE: PAY
     ===================================================== */

  function luhn(num) {
    var sum = 0;
    var alt = false;

    for (var i = num.length - 1; i >= 0; i--) {
      var n = parseInt(num.charAt(i), 10);

      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }

      sum += n;
      alt = !alt;
    }

    return sum % 10 === 0;
  }

  function cardBrand(digits) {
    if (/^4/.test(digits)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
    if (/^3[47]/.test(digits)) return "American Express";
    if (/^(60|65|81|82|508)/.test(digits)) return "RuPay";

    return "";
  }

  function initPay() {
    var order = getOrder();

    if (!validOrder(order)) {
      location.replace("/cart");
      return;
    }

    if (order.status === "paid") {
      location.replace("/order-success");
      return;
    }

    setText("pay-amount", fmt(order.total));
    setText("pay-order-ref", order.orderRef);

    setText(
      "pay-items-count",
      order.items.reduce(function (s, i) {
        return s + Number(i.qty);
      }, 0) + " item(s)"
    );

    setText("pay-customer", order.customer.name);

    $("pay-btn").textContent = "Pay " + fmt(order.total);

    /* --- Method tabs --- */

    var method = "upi";
    var tabs = document.querySelectorAll(".gw-tab");

    function selectMethod(m) {
      method = m;

      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-method") === m;

        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });

      ["upi", "card", "netbanking"].forEach(function (k) {
        $("panel-" + k).hidden = k !== m;
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        selectMethod(tab.getAttribute("data-method"));
      });
    });

    selectMethod("upi");

    function setErr(inputId, errId, msg) {
      setText(errId, msg || "");

      var input = $(inputId);

      if (input) {
        input.classList.toggle("is-invalid", !!msg);
        input.setAttribute("aria-invalid", msg ? "true" : "false");
      }

      return !msg;
    }

    /* --- UPI --- */

    document.querySelectorAll("[data-fill-upi]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        $("upi-id").value = chip.getAttribute("data-fill-upi");
        setErr("upi-id", "e-upi", "");
      });
    });

    function validateUpi() {
      var v = $("upi-id").value.trim();

      var ok = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(v);

      setErr(
        "upi-id",
        "e-upi",
        ok ? "" : "Enter a UPI ID like demo@okbank."
      );

      return ok
        ? {
            ok: true,
            method: "UPI",
            detail: "UPI (demo)",
            upi: v,
          }
        : { ok: false };
    }

    /* --- Card --- */

    $("card-number").addEventListener("input", function (e) {
      var d = e.target.value.replace(/\D/g, "").slice(0, 19);

      e.target.value = d.replace(/(.{4})/g, "$1 ").trim();

      setText("card-brand", cardBrand(d));
    });

    $("card-expiry").addEventListener("input", function (e) {
      var d = e.target.value.replace(/\D/g, "").slice(0, 4);

      e.target.value =
        d.length >= 3
          ? d.slice(0, 2) + "/" + d.slice(2)
          : d;
    });

    $("card-cvv").addEventListener("input", function (e) {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
    });

    function validateCard() {
      var digits = $("card-number").value.replace(/\D/g, "");

      var okNum = setErr(
        "card-number",
        "e-card-number",
        digits.length >= 13 && luhn(digits)
          ? ""
          : "Enter a valid card number (use the demo card above)."
      );

      var okName = setErr(
        "card-name",
        "e-card-name",
        $("card-name").value.trim().length >= 2
          ? ""
          : "Enter the name on the card."
      );

      var exp = $("card-expiry").value;
      var okExp = false;

      var m = /^(\d{2})\/(\d{2})$/.exec(exp);

      if (m) {
        var mm = parseInt(m[1], 10);
        var yy = 2000 + parseInt(m[2], 10);
        var now = new Date();

        okExp =
          mm >= 1 &&
          mm <= 12 &&
          (yy > now.getFullYear() ||
            (yy === now.getFullYear() &&
              mm >= now.getMonth() + 1));
      }

      okExp = setErr(
        "card-expiry",
        "e-card-expiry",
        okExp ? "" : "Enter a valid future date (MM/YY)."
      );

      var okCvv = setErr(
        "card-cvv",
        "e-card-cvv",
        /^\d{3,4}$/.test($("card-cvv").value)
          ? ""
          : "Enter 3 or 4 digits."
      );

      if (!(okNum && okName && okExp && okCvv)) {
        return { ok: false };
      }

      var brand = cardBrand(digits);

      // Card number, expiry, name and CVV are never stored.
      return {
        ok: true,
        method: "Card",
        detail: (brand ? brand + " card" : "Card") + " (demo)",
      };
    }

    /* --- Net banking --- */

    var bank = "";
    var bankGrid = $("bank-grid");

    bankGrid.innerHTML = BANKS.map(function (b) {
      return (
        '<button type="button" class="bank" data-bank="' +
        esc(b) +
        '" aria-pressed="false">' +
        '<span class="bank-dot"></span>' +
        esc(b) +
        "</button>"
      );
    }).join("");

    bankGrid.addEventListener("click", function (e) {
      var btn = e.target.closest(".bank");

      if (!btn) return;

      bank = btn.getAttribute("data-bank");

      bankGrid.querySelectorAll(".bank").forEach(function (b) {
        b.setAttribute(
          "aria-pressed",
          b === btn ? "true" : "false"
        );
      });

      setText("e-bank", "");
    });

    function validateBank() {
      if (!bank) {
        setText("e-bank", "Please choose a demo bank.");
        return { ok: false };
      }

      return {
        ok: true,
        method: "Net banking",
        detail: bank + " (demo net banking)",
        bank: bank,
      };
    }

    /* --- Overlay + simulation --- */

    var timers = [];

    function later(fn, ms) {
      timers.push(setTimeout(fn, ms));
    }

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function showView(id) {
      ["ov-processing", "ov-bank", "ov-final"].forEach(function (k) {
        $(k).hidden = k !== id;
      });

      var h = $(id).querySelector("h2");

      if (h) h.focus();
    }

    function closeOverlay() {
      clearTimers();

      $("overlay").hidden = true;
      document.body.style.overflow = "";

      var payBtn = $("pay-btn");

      payBtn.disabled = false;
      payBtn.removeAttribute("aria-busy");

      $("sim-success").disabled = false;
      $("sim-fail").disabled = false;
    }

    function startPayment(res) {
      var steps = [
        "Connecting to the MyShop demo gateway\u2026",
      ];

      if (res.method === "UPI") {
        steps.push(
          "Sending a collect request to " + res.upi + " (demo)\u2026"
        );
        steps.push(
          "Waiting for approval in your UPI app (demo)\u2026"
        );
      } else if (res.method === "Card") {
        steps.push("Processing card details (demo)\u2026");
        steps.push("Redirecting to the demo bank page\u2026");
      } else {
        steps.push("Redirecting to " + res.bank + " (demo)\u2026");
        steps.push("Waiting for bank confirmation (demo)\u2026");
      }

      order.method = res.method;
      order.methodDetail = res.detail;
      order.status = "processing";

      // No payment credentials are included in this saved order.
      saveOrder(order);

      var payBtn = $("pay-btn");

      payBtn.disabled = true;
      payBtn.setAttribute("aria-busy", "true");

      $("overlay").hidden = false;
      document.body.style.overflow = "hidden";

      showView("ov-processing");

      var ul = $("ov-steps");

      ul.innerHTML = steps
        .map(function (s) {
          return "<li>" + esc(s) + "</li>";
        })
        .join("");

      steps.forEach(function (_, i) {
        later(
          function () {
            markSteps(ul, i);
          },
          150 + i * 1200
        );
      });

      later(
        function () {
          markSteps(ul, steps.length);
        },
        150 + steps.length * 1200
      );

      later(
        function () {
          showView("ov-bank");
        },
        150 + steps.length * 1200 + 500
      );
    }

    function finish(success) {
      $("sim-success").disabled = true;
      $("sim-fail").disabled = true;

      var reason = $("fail-reason").value;

      showView("ov-final");

      later(function () {
        if (success) {
          order.status = "paid";
          order.txnRef = newTxnRef();
          order.paidAt = new Date().toISOString();

          delete order.failureReason;

          saveOrder(order);
          location.href = "/order-success";
        } else {
          order.status = "failed";
          order.failureReason = reason;
          order.failedAt = new Date().toISOString();

          saveOrder(order);
          location.href = "/order-failed";
        }
      }, 1000);
    }

    $("sim-success").addEventListener("click", function () {
      finish(true);
    });

    $("sim-fail").addEventListener("click", function () {
      finish(false);
    });

    $("ov-cancel").addEventListener("click", function () {
      order.status = "pending";
      saveOrder(order);
      closeOverlay();
    });

    $("pay-btn").addEventListener("click", function () {
      var res =
        method === "upi"
          ? validateUpi()
          : method === "card"
            ? validateCard()
            : validateBank();

      if (!res.ok) return;

      startPayment(res);
    });
  }

  /* =====================================================
     PAGE: ORDER SUCCESS
     ===================================================== */

  function initSuccess() {
    var SR = window.ShiprocketDemo;
    var o = getOrder();

    if (!validOrder(o)) {
      location.replace("/cart");
      return;
    }

    if (o.status !== "paid") {
      location.replace(
        o.status === "failed" ? "/order-failed" : "/pay"
      );
      return;
    }

    setText("ok-order-ref", o.orderRef);
    setText("ok-txn-ref", o.txnRef);
    setText("ok-method", o.methodDetail);
    setText("ok-date", formatDate(o.paidAt));

    setText(
      "ok-customer",
      o.customer.name + " \u00B7 " + o.customer.email
    );

    setText(
      "ok-address",
      o.customer.address +
        ", " +
        o.customer.city +
        (o.customer.state ? ", " + o.customer.state : "") +
        " - " +
        o.customer.pincode
    );

    renderItems($("ok-items"), o.items);

    fillTotals({
      subtotal: o.subtotal,
      shipping: o.shipping,
      total: o.total,
    });

    if (!o.cartCleared) {
      clearCart();
      o.cartCleared = true;
      saveOrder(o);
    }

    $("download-receipt").addEventListener("click", function () {
      downloadReceipt(o);
    });

    /* --- Shipment --- */

    if (!o.delivery) {
      $("ship-card").hidden = true;
      return;
    }

    function renderShipment(rec) {
      $("ship-progress").hidden = true;
      $("ship-details").hidden = false;

      setText("sh-courier", rec.courierName);
      setText("sh-awb", rec.awb);
      setText("sh-pickup", formatDay(rec.pickupDate));
      setText("sh-etd", formatDay(rec.etd));
      setText("sh-status", SR.STAGES[rec.stageIndex].label);

      $("track-link").href =
        "/track?awb=" + encodeURIComponent(rec.awb);
    }

    var existing =
      o.shipment && o.shipment.awb
        ? SR.findShipment(o.shipment.awb)
        : null;

    if (existing) {
      renderShipment(existing);
      return;
    }

    var ul = $("ship-steps");

    ul.innerHTML = [
      "Creating shipment order",
      "Assigning courier and generating AWB",
      "Scheduling pickup",
    ]
      .map(function (s) {
        return "<li>" + esc(s) + "\u2026</li>";
      })
      .join("");

    SR.shipOrder(o, function (i) {
      markSteps(ul, i);
    })
      .then(function (rec) {
        o.shipment = { awb: rec.awb };
        saveOrder(o);
        renderShipment(rec);
      })
      .catch(function () {
        setText(
          "ship-error",
          "We couldn't create the demo shipment. Please reload this page to try again."
        );

        $("ship-error").hidden = false;
      });
  }

  /* =====================================================
     PAGE: ORDER FAILED
     ===================================================== */

  function initFailed() {
    var o = getOrder();

    if (!validOrder(o)) {
      location.replace("/cart");
      return;
    }

    if (o.status === "paid") {
      location.replace("/order-success");
      return;
    }

    if (o.status !== "failed") {
      location.replace("/pay");
      return;
    }

    setText(
      "bad-reason",
      o.failureReason || "Payment failed (demo)."
    );

    setText("bad-amount", fmt(o.total));
    setText("bad-order-ref", o.orderRef);
    setText("bad-method", o.methodDetail || "Not selected");

    $("retry-btn").addEventListener("click", function () {
      o.status = "pending";

      delete o.failureReason;

      saveOrder(o);
      location.href = "/pay";
    });
  }

  /* =====================================================
     PAGE: TRACK
     ===================================================== */

  function initTrack() {
    var SR = window.ShiprocketDemo;
    var lastStage = SR.STAGES.length - 1;
    var currentAwb = "";

    function render(rec) {
      currentAwb = rec.awb;

      $("track-msg").hidden = true;
      $("track-result").hidden = false;

      var done = rec.stageIndex >= lastStage;
      var badge = $("tr-status");

      badge.textContent = SR.STAGES[rec.stageIndex].label;
      badge.className = "st-badge" + (done ? " is-done" : "");

      setText("tr-awb", rec.awb);
      setText("tr-order", rec.orderRef);
      setText("tr-courier", rec.courierName);

      setText(
        "tr-route",
        rec.from.city +
          " (" +
          rec.from.pincode +
          ") \u2192 " +
          rec.to.city +
          " (" +
          rec.to.pincode +
          ")"
      );

      setText(
        "tr-etd",
        done ? "Delivered" : formatDay(rec.etd)
      );

      $("tl").innerHTML = SR.STAGES.map(function (s, i) {
        var ev = rec.events.filter(function (e) {
          return e.stage === i;
        })[0];

        var cls =
          i < rec.stageIndex
            ? "done"
            : i === rec.stageIndex
              ? "done current"
              : "";

        var detail = ev
          ? esc(ev.activity) +
            " \u00B7 " +
            esc(ev.location) +
            " \u00B7 " +
            esc(formatDate(ev.date))
          : "Pending";

        return (
          '<li class="' +
          cls +
          '">' +
          "<strong>" +
          esc(s.label) +
          "</strong>" +
          "<small>" +
          detail +
          "</small>" +
          "</li>"
        );
      }).join("");

      $("adv-btn").hidden = done;
    }

    function search(query) {
      var rec = SR.findShipment(query);

      if (!rec) {
        $("track-result").hidden = true;
        $("track-msg").hidden = false;

        setText(
          "track-msg",
          "No shipment found for \u201C" +
            String(query).trim() +
            "\u201D. Complete a demo order first, or check the reference."
        );

        return;
      }

      render(rec);
    }

    var params = new URLSearchParams(location.search);

    var q =
      params.get("awb") ||
      params.get("order") ||
      "";

    if (!q) {
      var last = getOrder();

      if (last && last.shipment) {
        q = last.shipment.awb;
      }
    }

    $("track-q").value = q;

    $("track-form").addEventListener("submit", function (e) {
      e.preventDefault();
      search($("track-q").value);
    });

    $("adv-btn").addEventListener("click", function () {
      var rec = SR.advance(currentAwb);
      if (rec) render(rec);
    });

    $("reset-btn").addEventListener("click", function () {
      var rec = SR.resetTimeline(currentAwb);
      if (rec) render(rec);
    });

    if (q) search(q);
  }

  /* ---------- Error banner ---------- */

  function showFatal(root, message) {
    if (window.console && console.error) {
      console.error("[MyShop demo]", message);
    }

    var box = document.createElement("div");

    box.setAttribute("role", "alert");

    box.style.cssText =
      "background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;border-radius:12px;padding:12px 16px;margin:0 0 16px;font:600 14px system-ui,sans-serif";

    box.textContent = "Demo script problem: " + message;

    root.insertBefore(box, root.firstChild);
  }

  /* ---------- Start the right page ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.querySelector("[data-dp-page]");

    if (!root) return;

    var page = root.getAttribute("data-dp-page");

    var needsShipping =
      page === "checkout" ||
      page === "success" ||
      page === "track";

    if (needsShipping && !window.ShiprocketDemo) {
      showFatal(
        root,
        "shipping.js did not load. Check that it is saved as public/shipping.js (not .txt) and that its code is complete."
      );
      return;
    }

    var init = {
      checkout: initCheckout,
      pay: initPay,
      success: initSuccess,
      failed: initFailed,
      track: initTrack,
    }[page];

    if (!init) return;

    try {
      init();
    } catch (err) {
      showFatal(
        root,
        (err && err.message) || String(err)
      );
    }
  });
})();
