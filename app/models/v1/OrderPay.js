let mongoose = require("mongoose");
let Schema = mongoose.Schema;
const timestamps = require("mongoose-timestamp");

let OrderPay = new Schema({
  active: { type: Boolean, default: true },
  employer: { type: Schema.Types.ObjectId, ref: "User" },
  paid: { type: Boolean, default: false },
  authority: { type: String, unique: true, sparse: true },
  paymentGateway: { type: String, required: true },
  amount: { type: Number },
  keylinkOrder: { type: String },
});

OrderPay.plugin(timestamps);

module.exports = mongoose.model("OrderPay", OrderPay);
