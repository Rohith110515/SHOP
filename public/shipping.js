/* Simulated Shiprocket-style shipping module (DEMO).
   Each function returns a Promise and mimics the shape of the real Shiprocket API,
   so it can later be replaced with real calls made from a server. */
(function () {
  "use strict";

  var STORE_KEY = "myshop-demo-shipments";

  // The store's pickup location (Shiprocket calls this a "pickup location" with a nickname)
  var PICKUP = { nickname: "MyShop Warehouse", city: "Coimbatore", pincode: "641001" };

  var WEIGHTS = { Electronics: 0.6, Fashion: 0.8, Accessories: 0.3 }; // kg per unit, by category
  var DEFAULT_WEIGHT = 0.5;

  // Fictional couriers, so nothing implies a real partnership
  var COURIERS = [
    { id: 101, name: "Demo Surface", mult: 1.0, daysAdd: 2 },
    { id: 102, name: "Demo Standard", mult: 1.3, daysAdd: 0 },
    { id: 103, name: "Demo Air Express", mult: 1.9, daysAdd: -1 }
  ];

  // Tracking stages
  var STAGES = [
    { label: "Order confirmed", text: function () { return "Order confirmed. Payment received (demo)"; }, loc: function (r) { return r.from.city; } },
    { label: "Pickup scheduled", text: function (r) { return "Pickup scheduled with " + r.courierName; }, loc: function (r) { return r.from.city; } },
    { label: "Picked up", text: function (r) { return "Shipment picked up from " + r.from.city; }, loc: function (r) { return r.from.city; } },
    { label: "In transit", text: function (r) { return "Shipment in transit to " + r.to.city; }, loc: function () { return "Transit hub (demo)"; } },
    { label: "Out for delivery", text: function () { return "Out for delivery"; }, loc: function (r) { return r.to.city; } },
    { label: "Delivered", text: function (r) { return "Delivered to " + r.to.name; }, loc: function (r) { return r.to.city; } }
  ];

  function wait(ms, value) { return new Promise(function (resolve) { setTimeout(function () { resolve(value); }, ms); }); }
  function rand(n) { var s = ""; while (s.length < n) s += Math.floor(Math.random() * 10); return s; }
  function daysFromNow(d) { return new Date(Date.now() + d * 86400000).toISOString(); }

  /* ---------- Local storage of shipments ---------- */
  function listShipments() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function upsert(rec) {
    var list = listShipments().filter(function (r) { return r.awb !== rec.awb; });
    list.unshift(rec);
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }
  function findShipment(query) {
    var q = String(query || "").trim().toUpperCase();
    if (!q) return null;
    return listShipments().filter(function (r) {
      return String(r.awb).toUpperCase() === q || String(r.orderRef).toUpperCase() === q;
    })[0] || null;
  }
  function makeEvent(rec, idx) {
    return { stage: idx, label: STAGES[idx].label, activity: STAGES[idx].text(rec), location: STAGES[idx].loc(rec), date: new Date().toISOString() };
  }

  /* ---------- Helpers ---------- */
  function packageWeight(items) {
    var w = items.reduce(function (sum, i) { return sum + (WEIGHTS[i.category] || DEFAULT_WEIGHT) * i.qty; }, 0);
    return Math.max(0.5, Math.round(w * 100) / 100);
  }
  function zoneOf(pickup, delivery) {
    if (pickup.slice(0, 3) === delivery.slice(0, 3)) return "local";
    if (pickup.charAt(0) === delivery.charAt(0)) return "regional";
    return "national";
  }

  /* ---------- API-shaped functions ---------- */

  // Real: GET /v1/external/courier/serviceability/
  function checkServiceability(params) {
    var pickup = String(params.pickup_postcode || "");
    var delivery = String(params.delivery_postcode || "");
    var weight = Number(params.weight) || 0.5;

    if (!/^\d{6}$/.test(delivery) || !/^\d{6}$/.test(pickup)) {
      return wait(300, { status: 422, message: "Enter a valid 6-digit PIN code.", data: { available_courier_companies: [] } });
    }
    // Demo rule so you can show a failure case: PIN codes starting with 0 or 9 are not serviceable
    if (delivery.charAt(0) === "0" || delivery.charAt(0) === "9") {
      return wait(800, { status: 404, message: "Sorry, no courier delivers to this PIN code (demo rule).", data: { available_courier_companies: [] } });
    }

    var zone = zoneOf(pickup, delivery);
    var base = { local: 35, regional: 55, national: 80 }[zone];
    var extra = { local: 20, regional: 30, national: 45 }[zone];
    var baseDays = { local: 1, regional: 3, national: 5 }[zone];
    var slabs = Math.max(0, Math.ceil((weight - 0.5) / 0.5));

    var list = COURIERS.map(function (c) {
      var days = Math.max(1, baseDays + c.daysAdd);
      return {
        courier_company_id: c.id,
        courier_name: c.name,
        rate: Math.round((base + slabs * extra) * c.mult),
        estimated_delivery_days: days,
        etd: daysFromNow(days),
        cod: 0
      };
    }).sort(function (a, b) { return a.rate - b.rate; });

    return wait(900, { status: 200, data: { available_courier_companies: list, recommended_courier_company_id: list[0].courier_company_id } });
  }

  // Real: POST /v1/external/orders/create/adhoc
  function createOrder(payload) {
    return wait(900, { order_id: Number("8" + rand(8)), shipment_id: Number("7" + rand(8)), status: "NEW", status_code: 1, payload: payload });
  }

  // Real: POST /v1/external/courier/assign/awb
  function assignAwb(params) {
    var courier = COURIERS.filter(function (c) { return c.id === params.courier_id; })[0] || COURIERS[0];
    return wait(800, {
      awb_assign_status: 1,
      response: { data: { shipment_id: params.shipment_id, courier_company_id: courier.id, courier_name: courier.name, awb_code: "DEMO" + rand(10) } }
    });
  }

  // Real: POST /v1/external/courier/generate/pickup
  function generatePickup(params) {
    return wait(800, {
      pickup_status: 1,
      response: { pickup_scheduled_date: daysFromNow(1), pickup_token_number: "Reference No: " + rand(8), shipment_id: params.shipment_id }
    });
  }

  // Runs the whole post-payment flow: create order -> assign courier/AWB -> schedule pickup
  function shipOrder(order, onStep) {
    var d = order.delivery, c = order.customer, step = onStep || function () {};
    var payload = {
      order_id: order.orderRef,
      order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
      pickup_location: PICKUP.nickname,
      billing_customer_name: c.name,
      billing_address: c.address,
      billing_city: c.city,
      billing_pincode: c.pincode,
      billing_state: c.state,
      billing_country: "India",
      billing_email: c.email,
      billing_phone: c.phone,
      shipping_is_billing: true,
      order_items: order.items.map(function (i) { return { name: i.name, sku: "SKU-" + i.id, units: i.qty, selling_price: i.price }; }),
      payment_method: "Prepaid",
      sub_total: order.subtotal,
      weight: d.weight
    };

    step(0);
    return createOrder(payload).then(function (created) {
      step(1);
      return assignAwb({ shipment_id: created.shipment_id, courier_id: d.courierId }).then(function (awb) {
        step(2);
        return generatePickup({ shipment_id: [created.shipment_id] }).then(function (pickup) {
          step(3);
          var rec = {
            orderRef: order.orderRef,
            srOrderId: created.order_id,
            shipmentId: created.shipment_id,
            awb: awb.response.data.awb_code,
            courierId: d.courierId,
            courierName: awb.response.data.courier_name,
            pickupDate: pickup.response.pickup_scheduled_date,
            etd: d.etd,
            weight: d.weight,
            from: { city: PICKUP.city, pincode: PICKUP.pincode },
            to: { name: c.name, city: c.city, pincode: c.pincode },
            stageIndex: 1,
            createdAt: new Date().toISOString()
          };
          rec.events = [makeEvent(rec, 0), makeEvent(rec, 1)];
          upsert(rec);
          return rec;
        });
      });
    });
  }

  // Demo-only controls (a real integration gets updates from the tracking API or webhooks)
  function advance(awb) {
    var rec = findShipment(awb);
    if (!rec || rec.stageIndex >= STAGES.length - 1) return rec;
    rec.stageIndex += 1;
    rec.events.push(makeEvent(rec, rec.stageIndex));
    upsert(rec);
    return rec;
  }
  function resetTimeline(awb) {
    var rec = findShipment(awb);
    if (!rec) return null;
    rec.stageIndex = 1;
    rec.events = rec.events.filter(function (e) { return e.stage <= 1; });
    upsert(rec);
    return rec;
  }

  window.ShiprocketDemo = {
    PICKUP: PICKUP,
    STAGES: STAGES,
    packageWeight: packageWeight,
    checkServiceability: checkServiceability,
    createOrder: createOrder,
    assignAwb: assignAwb,
    generatePickup: generatePickup,
    shipOrder: shipOrder,
    findShipment: findShipment,
    listShipments: listShipments,
    advance: advance,
    resetTimeline: resetTimeline
  };
})();