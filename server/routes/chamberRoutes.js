const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { protect } = require("../middleware/authMiddleware");
const { ensureActiveSubscription } = require("../middleware/subscriptionMiddleware");
const { uploadDir, upload } = require("../middleware/chamberUpload");
const { ChamberCustomer, ChamberNotification, makeId } = require("../models/ChamberModels");

const router = express.Router();
router.use(protect);
router.use(ensureActiveSubscription);

const ownerFilter = (req) => ({ ownerId: req.user._id });

function padTime(d) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function dateDiffDays(a, b) {
  const ms = b.getTime() - a.getTime();
  const days = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  return { days };
}

function datePartsDiff(a, b) {
  let y = b.getFullYear() - a.getFullYear();
  let m = b.getMonth() - a.getMonth();
  let d = b.getDate() - a.getDate();
  if (d < 0) {
    m -= 1;
    const prev = new Date(b.getFullYear(), b.getMonth(), 0);
    d += prev.getDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d };
}

function monthsBetweenRemoval(startMs, removeMs) {
  const startDate = new Date(startMs);
  const removeDate = new Date(removeMs);
  const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const r = new Date(removeDate.getFullYear(), removeDate.getMonth(), removeDate.getDate());
  const diff = datePartsDiff(s, r);
  let removed_months = diff.y * 12 + diff.m;
  if (diff.d > 0) removed_months += 1;
  return Math.max(1, removed_months);
}

function enrichBox(box) {
  const raw = box.toObject ? box.toObject() : { ...box };
  const boxDateStr = raw.date && String(raw.date).trim() ? raw.date : new Date().toISOString();
  const start = new Date(boxDateStr);
  const now = new Date();
  const diff = start > now ? { days: 0 } : dateDiffDays(start, now);
  const days = diff.days;
  const months = Math.floor(days / 30);
  const rem_days = days % 30;
  const boxCount = raw.box != null ? Number(raw.box) : 0;
  const rentPerBox = raw.rent_per_box != null ? Number(raw.rent_per_box) : 0;
  const origBoxDisplay = raw.original_box != null ? Number(raw.original_box) : boxCount;
  const future_months = months === 0 ? 1 : months + 1;
  const future_rent = boxCount * rentPerBox * future_months;

  let total_rent = 0;
  if (Array.isArray(raw.removed)) for (const rem of raw.removed) total_rent += rem.rent != null ? Number(rem.rent) : 0;
  if (Array.isArray(raw.paid)) for (const paid of raw.paid) total_rent -= paid.amount != null ? Number(paid.amount) : 0;
  if (total_rent < 0) total_rent = 0;

  return { ...raw, days, months, rem_days, time: padTime(start), origBoxDisplay, future_rent, total_rent };
}

function enrichCustomerDoc(c) {
  if (!c) return c;
  const o = c.toObject ? c.toObject() : { ...c };
  if (o.fruits) o.fruits = o.fruits.map((f) => ({ ...f, boxes: (f.boxes || []).map(enrichBox) }));
  return o;
}

function findFruit(customer, fruitId) {
  return (customer.fruits || []).find((f) => String(f._id) === String(fruitId));
}

function findBox(fruit, boxId) {
  return (fruit.boxes || []).find((b) => String(b._id) === String(boxId));
}

function recalcFutureRentFromStored(box) {
  const start = new Date(box.date).getTime();
  const now = Date.now();
  const box_months = Math.max(1, Math.floor((now - start) / (30 * 24 * 60 * 60 * 1000)));
  const rent_per_box = box.rent_per_box != null ? Number(box.rent_per_box) : 0;
  const cnt = box.box != null ? Number(box.box) : 0;
  return cnt * rent_per_box * box_months;
}

router.get("/customers", async (req, res) => {
  try {
    const list = await ChamberCustomer.find(ownerFilter(req), { name: 1, phone: 1, address: 1, photo: 1 })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.get("/customers/:id", async (req, res) => {
  try {
    const c = await ChamberCustomer.findOne({ _id: req.params.id, ...ownerFilter(req) });
    if (!c) return res.status(404).json({ error: "Customer not found" });
    res.json(enrichCustomerDoc(c));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.post("/customers", upload.single("photo"), async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "name and phone required" });
    const photo = req.file ? req.file.filename : "";
    const doc = await ChamberCustomer.create({
      ownerId: req.user._id,
      name,
      phone,
      address: address || "",
      photo,
      fruits: [],
    });
    res.status(201).json(enrichCustomerDoc(doc));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.patch("/customers/:id", async (req, res) => {
  try {
    const c = await ChamberCustomer.findOne({ _id: req.params.id, ...ownerFilter(req) });
    if (!c) return res.status(404).json({ error: "Customer not found" });
    const name = req.body.name != null ? String(req.body.name).trim() : c.name;
    const phone = req.body.phone != null ? String(req.body.phone).trim() : c.phone;
    const address = req.body.address != null ? String(req.body.address).trim() : c.address;
    c.name = name;
    c.phone = phone;
    c.address = address;
    await c.save();
    res.json(enrichCustomerDoc(c));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.delete("/customers/:id", async (req, res) => {
  try {
    const c = await ChamberCustomer.findOne({ _id: req.params.id, ...ownerFilter(req) });
    if (!c) return res.status(404).json({ error: "Customer not found" });
    if (c.photo) {
      const p = path.join(uploadDir, c.photo);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    await ChamberCustomer.deleteOne({ _id: req.params.id, ...ownerFilter(req) });
    await ChamberNotification.deleteMany({ customerId: String(req.params.id), ...ownerFilter(req) });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.post("/customers/:id/fruits", async (req, res) => {
  try {
    const c = await ChamberCustomer.findOne({ _id: req.params.id, ...ownerFilter(req) });
    if (!c) return res.status(404).json({ error: "Customer not found" });
    const { fruitname, chamber } = req.body;
    if (!fruitname || !chamber) return res.status(400).json({ error: "fruitname and chamber required" });
    c.fruits.push({ _id: makeId(), fruitname: String(fruitname).trim(), chamber: String(chamber).trim(), boxes: [] });
    await c.save();
    res.status(201).json(enrichCustomerDoc(c));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.delete("/customers/:customerId/fruits/:fruitId", async (req, res) => {
  try {
    const c = await ChamberCustomer.findOne({ _id: req.params.customerId, ...ownerFilter(req) });
    if (!c) return res.status(404).json({ error: "Customer not found" });
    if (!findFruit(c, req.params.fruitId)) return res.status(404).json({ error: "Fruit not found" });
    c.fruits = (c.fruits || []).filter((f) => String(f._id) !== String(req.params.fruitId));
    await c.save();
    await ChamberNotification.deleteMany({ customerId: String(req.params.customerId), fruitId: String(req.params.fruitId), ...ownerFilter(req) });
    res.json(enrichCustomerDoc(c));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.post("/customers/:customerId/fruits/:fruitId/boxes", async (req, res) => {
  try {
    const c = await ChamberCustomer.findOne({ _id: req.params.customerId, ...ownerFilter(req) });
    if (!c) return res.status(404).json({ error: "Customer not found" });
    const fruit = findFruit(c, req.params.fruitId);
    if (!fruit) return res.status(404).json({ error: "Fruit not found" });
    const { box, date, rent_per_box } = req.body;
    const nBox = parseInt(box, 10);
    const rent = parseFloat(rent_per_box);
    if (!date || Number.isNaN(nBox) || nBox < 1 || Number.isNaN(rent) || rent < 0) {
      return res.status(400).json({ error: "Invalid box, date, or rent_per_box" });
    }
    const future_rent = nBox * rent;
    fruit.boxes.push({
      _id: makeId(),
      date: String(date),
      box: nBox,
      original_box: nBox,
      rent_per_box: rent,
      future_rent,
      total_rent: 0,
      removed: [],
      paid: [],
    });
    await c.save();
    res.json(enrichCustomerDoc(c));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.post("/customers/:customerId/fruits/:fruitId/boxes/:boxId/pay", async (req, res) => {
  try {
    const c = await ChamberCustomer.findOne({ _id: req.params.customerId, ...ownerFilter(req) });
    if (!c) return res.status(404).json({ error: "Customer not found" });
    const fruit = findFruit(c, req.params.fruitId);
    if (!fruit) return res.status(404).json({ error: "Fruit not found" });
    const box = findBox(fruit, req.params.boxId);
    if (!box) return res.status(404).json({ error: "Box not found" });
    const paidAmount = parseFloat(req.body.paid_amount);
    const paid_datetime = req.body.paid_datetime;
    if (Number.isNaN(paidAmount) || !paid_datetime) {
      return res.status(400).json({ error: "paid_amount and paid_datetime required" });
    }
    box.paid.push({ amount: paidAmount, datetime: String(paid_datetime) });
    const sumPaid = (box.paid || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const sumRem = (box.removed || []).reduce((s, r) => s + Number(r.rent || 0), 0);
    box.total_rent = Math.max(0, Number(sumRem) - Number(sumPaid));
    await c.save();
    res.json(enrichCustomerDoc(c));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.post("/customers/:customerId/fruits/:fruitId/boxes/:boxId/remove", async (req, res) => {
  try {
    const c = await ChamberCustomer.findOne({ _id: req.params.customerId, ...ownerFilter(req) });
    if (!c) return res.status(404).json({ error: "Customer not found" });
    const fruit = findFruit(c, req.params.fruitId);
    if (!fruit) return res.status(404).json({ error: "Fruit not found" });
    const box = findBox(fruit, req.params.boxId);
    if (!box) return res.status(404).json({ error: "Box not found" });
    const removeBox = parseInt(req.body.remove_box_count, 10);
    const removeDateTime = req.body.remove_datetime;
    if (Number.isNaN(removeBox) || removeBox < 1 || !removeDateTime) {
      return res.status(400).json({ error: "remove_box_count and remove_datetime required" });
    }
    const current = box.box != null ? box.box : 0;
    if (removeBox > current) return res.status(400).json({ error: "Cannot remove more than stored" });

    const start = new Date(box.date).getTime();
    const removeAt = new Date(removeDateTime).getTime();
    const removed_months = monthsBetweenRemoval(start, removeAt);
    const rent_per_box = box.rent_per_box != null ? Number(box.rent_per_box) : 0;
    const removed_rent = removeBox * rent_per_box * removed_months;

    const nextCount = current - removeBox;
    const future_rent = recalcFutureRentFromStored({
      date: box.date,
      box: Math.max(0, nextCount),
      rent_per_box,
    });

    box.removed.push({ count: removeBox, datetime: String(removeDateTime), rent: removed_rent, months: removed_months });
    box.box = Math.max(0, nextCount);
    box.future_rent = future_rent;

    const sumPaid = (box.paid || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const sumRem = (box.removed || []).reduce((s, r) => s + Number(r.rent || 0), 0);
    box.total_rent = Math.max(0, Number(sumRem) - Number(sumPaid));

    await c.save();
    res.json(enrichCustomerDoc(c));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.delete("/customers/:customerId/fruits/:fruitId/boxes/:boxId/removed/:removedIndex", async (req, res) => {
  try {
    const c = await ChamberCustomer.findOne({ _id: req.params.customerId, ...ownerFilter(req) });
    if (!c) return res.status(404).json({ error: "Customer not found" });
    const fruit = findFruit(c, req.params.fruitId);
    if (!fruit) return res.status(404).json({ error: "Fruit not found" });
    const box = findBox(fruit, req.params.boxId);
    if (!box) return res.status(404).json({ error: "Box not found" });
    const idx = parseInt(req.params.removedIndex, 10);
    const row = (box.removed || [])[idx];
    if (!row) return res.status(404).json({ error: "Removed entry not found" });
    const restored = row.count != null ? parseInt(row.count, 10) : 0;
    box.removed.splice(idx, 1);
    box.box = (box.box || 0) + restored;
    box.future_rent = recalcFutureRentFromStored({ date: box.date, box: box.box, rent_per_box: Number(box.rent_per_box) });
    const sumPaid = (box.paid || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const sumRem = (box.removed || []).reduce((s, r) => s + Number(r.rent || 0), 0);
    box.total_rent = Math.max(0, Number(sumRem) - Number(sumPaid));
    await c.save();
    res.json(enrichCustomerDoc(c));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.delete("/customers/:customerId/fruits/:fruitId/boxes/:boxId", async (req, res) => {
  try {
    const c = await ChamberCustomer.findOne({ _id: req.params.customerId, ...ownerFilter(req) });
    if (!c) return res.status(404).json({ error: "Customer not found" });
    const fruit = findFruit(c, req.params.fruitId);
    if (!fruit) return res.status(404).json({ error: "Fruit not found" });
    if (!findBox(fruit, req.params.boxId)) return res.status(404).json({ error: "Box not found" });
    fruit.boxes = (fruit.boxes || []).filter((b) => String(b._id) !== String(req.params.boxId));
    await c.save();
    await ChamberNotification.deleteMany({ customerId: String(req.params.customerId), fruitId: String(req.params.fruitId), boxId: String(req.params.boxId), ...ownerFilter(req) });
    res.json(enrichCustomerDoc(c));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.get("/dashboard/stats", async (req, res) => {
  try {
    const customers = await ChamberCustomer.find(ownerFilter(req)).lean();
    const now = new Date();
    const allFruitNames = {};
    let totalBoxes = 0;
    let pendingRent = 0;
    const pendingRows = [];
    const todayRows = [];
    const fruitBoxCount = {};

    const sameLocalDay = (isoOrStr, ref = now) => {
      if (!isoOrStr) return false;
      const d = new Date(isoOrStr);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
    };

    for (const customer of customers) {
      for (const fruit of customer.fruits || []) {
        const fruitKey = String(fruit.fruitname || "").trim().toLowerCase();
        if (fruitKey) allFruitNames[fruitKey] = fruit.fruitname;

        for (const box of fruit.boxes || []) {
          const b = enrichBox(box);
          const displayName = allFruitNames[fruitKey] || fruit.fruitname;
          const boxCount = b.box != null ? b.box : 0;
          totalBoxes += boxCount;
          if (!fruitBoxCount[displayName]) fruitBoxCount[displayName] = 0;
          fruitBoxCount[displayName] += boxCount;

          if (b.total_rent > 0) {
            pendingRent += b.total_rent;
            pendingRows.push({
              customer: customer.name,
              fruit: displayName,
              boxes: boxCount,
              months: b.months,
              rent_per_box: b.rent_per_box,
              total_rent: b.total_rent,
            });
          }

          if (sameLocalDay(b.date, now)) {
            todayRows.push({
              time: b.time,
              activity: "New Arrival",
              customer: customer.name,
              fruit: displayName,
              boxes: b.origBoxDisplay ?? b.box,
            });
          }
          if (Array.isArray(b.removed)) {
            for (const rem of b.removed) {
              if (sameLocalDay(rem.datetime, now)) {
                const t = rem.datetime ? new Date(rem.datetime) : null;
                todayRows.push({
                  time:
                    t && !Number.isNaN(t.getTime())
                      ? `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`
                      : "-",
                  activity: "Withdrawal",
                  customer: customer.name,
                  fruit: displayName,
                  boxes: rem.count ?? 0,
                });
              }
            }
          }
        }
      }
    }

    const uniqueFruitNames = [...new Set(Object.values(allFruitNames))];

    res.json({
      totalCustomers: customers.length,
      pendingRent,
      totalBoxes,
      totalFruitTypes: uniqueFruitNames.length,
      fruitBoxCount,
      chartLabels: Object.keys(fruitBoxCount),
      chartData: Object.values(fruitBoxCount),
      todayRows,
      pendingRows,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.get("/notifications/count", async (req, res) => {
  try {
    const total = await ChamberNotification.countDocuments(ownerFilter(req));
    res.type("text/plain").send(String(total));
  } catch (_e) {
    res.status(500).send("0");
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const list = await ChamberNotification.find(ownerFilter(req)).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.delete("/notifications/:id", async (req, res) => {
  try {
    const r = await ChamberNotification.deleteOne({ _id: String(req.params.id), ...ownerFilter(req) });
    if (r.deletedCount <= 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.post("/notifications/generate", async (req, res) => {
  try {
    const customers = await ChamberCustomer.find(ownerFilter(req)).lean();
    let created = 0;

    for (const customer of customers) {
      for (const fruit of customer.fruits || []) {
        for (const box of fruit.boxes || []) {
          const start = new Date(box.date).getTime();
          const now = Date.now();
          const months = Math.floor((now - start) / (30 * 24 * 60 * 60 * 1000));
          const boxCount = box.box != null ? box.box : 0;
          const rentPer = box.rent_per_box != null ? box.rent_per_box : 0;
          if (months < 1 || boxCount <= 0) continue;

          const pending = boxCount * rentPer * months;
          const eb = enrichBox(box);
          const storeBoxRent = eb.future_rent != null ? eb.future_rent : pending;
          if (pending <= 0) continue;

          try {
            await ChamberNotification.create({
              ownerId: req.user._id,
              customerId: String(customer._id),
              fruitId: String(fruit._id),
              boxId: String(box._id),
              customer: customer.name,
              fruit: fruit.fruitname,
              chamber: fruit.chamber,
              pending,
              store_box_rent: storeBoxRent,
              due_days: (now - start) / (24 * 60 * 60 * 1000),
              date: new Date(start).toLocaleDateString("en-GB"),
            });
            created += 1;
          } catch (_err) {}
        }
      }
    }

    res.json({ ok: true, created });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

router.get("/bill/pdf/:customerId/:fruitId/:boxId", async (req, res) => {
  const c = await ChamberCustomer.findOne({ _id: req.params.customerId, ...ownerFilter(req) }).lean();
  if (!c) return res.status(404).send("Customer not found");
  const fruit = (c.fruits || []).find((f) => String(f._id) === String(req.params.fruitId));
  if (!fruit) return res.status(404).send("Fruit not found");
  const box = (fruit.boxes || []).find((b) => String(b._id) === String(req.params.boxId));
  if (!box) return res.status(404).send("Box not found");

  const start = new Date(box.date).getTime();
  let latestRemovalDate = start;
  if (box.removed && box.removed.length) {
    for (const rem of box.removed) {
      if (rem.datetime) {
        const t = new Date(rem.datetime).getTime();
        if (t > latestRemovalDate) latestRemovalDate = t;
      }
    }
  }
  const days = Math.max(0, Math.floor((latestRemovalDate - start) / (24 * 60 * 60 * 1000)));
  const months = Math.floor(days / 30);
  const rem_days = days % 30;
  const origBox = box.original_box != null ? box.original_box : box.box;
  const rentPerBox = box.rent_per_box != null ? box.rent_per_box : 0;

  let withdrawnRent = 0;
  const withdrawals = [];
  if (box.removed) {
    for (const rem of box.removed) {
      let dateValue = "-";
      if (rem.datetime) dateValue = new Date(rem.datetime).toLocaleString("en-GB");
      withdrawnRent += rem.rent != null ? rem.rent : 0;
      withdrawals.push({
        datetime: dateValue,
        count: rem.count ?? 0,
        rent: rem.rent ?? 0,
        months: rem.months ?? 1,
      });
    }
  }

  let totalRent = 0;
  for (const rem of box.removed || []) totalRent += rem.rent != null ? rem.rent : 0;
  for (const paid of box.paid || []) totalRent -= paid.amount != null ? paid.amount : 0;
  if (totalRent < 0) totalRent = 0;

  let amountPaid = 0;
  const paymentHistory = [];
  for (const paid of box.paid || []) {
    amountPaid += paid.amount;
    paymentHistory.push({
      datetime: paid.datetime ? new Date(paid.datetime).toLocaleString("en-GB") : "-",
      amount: paid.amount,
    });
  }

  const startDate = new Date(box.date).toLocaleString("en-GB");
  const lastWithdrawDate = withdrawals.length ? withdrawals[withdrawals.length - 1].datetime : startDate;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="Fruit-Bill.pdf"');

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).fillColor("#4444aa").text("FRUIT CHAMBER STORAGE", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor("#666666").text("RENT BILL", { align: "center" });
  doc.moveDown();

  doc.fontSize(11).fillColor("#000000");
  doc.text(`Customer: ${c.name}`);
  doc.text(`Phone: ${c.phone || "N/A"}`);
  doc.text(`Fruit: ${fruit.fruitname}`);
  doc.moveDown();

  doc.text(`Arrival: ${startDate}`);
  doc.text(`Total boxes (original): ${origBox}`);
  doc.text(`Current boxes: ${box.box ?? 0}`);
  doc.text(`Rent per box / month: Rs. ${rentPerBox}`);
  doc.text(`Duration (to last withdrawal): ${months} months ${rem_days} days`);
  doc.text(`Last withdrawal: ${lastWithdrawDate}`);
  doc.moveDown();

  doc.fontSize(12).text("Withdrawals", { underline: true });
  if (!withdrawals.length) doc.fontSize(10).text("No withdrawals");
  else {
    withdrawals.forEach((w) => {
      doc.fontSize(10).text(`${w.datetime} — ${w.count} boxes, Rs.${w.rent} (${w.months} mo)`);
    });
    doc.text(`Total withdrawn rent: Rs.${withdrawnRent}`);
  }
  doc.moveDown();

  doc.fontSize(12).text("Payments", { underline: true });
  if (!paymentHistory.length) doc.fontSize(10).text("No payments");
  else {
    paymentHistory.forEach((p) => {
      doc.fontSize(10).text(`${p.datetime} — Rs.${p.amount}`);
    });
    doc.text(`Total paid: Rs.${amountPaid}`);
  }
  doc.moveDown();

  doc.fontSize(12).fillColor("#228822").text(`Balance (withdrawn rent - paid, capped): Rs.${totalRent}`);

  doc.end();
});

module.exports = router;
