const mongoose = require("mongoose");

function makeId() {
  return new mongoose.Types.ObjectId().toString();
}

const removedSchema = new mongoose.Schema({ count: Number, datetime: String, rent: Number, months: Number }, { _id: false });
const paidSchema = new mongoose.Schema({ amount: Number, datetime: String }, { _id: false });
const boxSchema = new mongoose.Schema({
  _id: { type: String, default: makeId },
  date: String,
  box: Number,
  original_box: Number,
  rent_per_box: Number,
  future_rent: Number,
  total_rent: Number,
  removed: { type: [removedSchema], default: [] },
  paid: { type: [paidSchema], default: [] }
}, { _id: false });
const fruitSchema = new mongoose.Schema({
  _id: { type: String, default: makeId },
  fruitname: String,
  chamber: String,
  boxes: { type: [boxSchema], default: [] }
}, { _id: false });

const chamberCustomerSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  name: String,
  phone: String,
  address: { type: String, default: "" },
  photo: { type: String, default: "" },
  fruits: { type: [fruitSchema], default: [] }
}, { timestamps: true, versionKey: false });

const chamberNotificationSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  customerId: String,
  fruitId: String,
  boxId: String,
  customer: String,
  fruit: String,
  chamber: String,
  pending: Number,
  store_box_rent: Number,
  due_days: Number,
  date: String
}, { timestamps: true, versionKey: false });

chamberNotificationSchema.index({ ownerId: 1, customerId: 1, fruitId: 1, boxId: 1 }, { unique: true });

const ChamberCustomer = mongoose.model("ChamberCustomer", chamberCustomerSchema);
const ChamberNotification = mongoose.model("ChamberNotification", chamberNotificationSchema);

module.exports = { ChamberCustomer, ChamberNotification, makeId };
