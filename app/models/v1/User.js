let mongoose = require("mongoose");
let Schema = mongoose.Schema;
const timestamps = require("mongoose-timestamp");
const bcrypt = require("bcrypt");

let User = new Schema({
  active: { type: Boolean, default: true },
  type: { type: Number, required: true }, // 1 -> employer, 2 -> employee
  name: { type: String },
  family: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, required: true, unique: true },
  company: String,
  address: String,
  nationalIDCode: Number,
  financialCode: Number,
  nationalCode: Number,
  registerNo: Number,
  postalCode: Number,
  acceptedLeadCount: { type: Number, default: 0 },
  employer: { type: Schema.Types.ObjectId, ref: "User" },
  employee: [{ type: Schema.Types.ObjectId, ref: "User" }],
  voipNumber: Number, // employee voip number
  voipNumbers: [], // employer voip numbers
  permission: {
    type: Object,
    default: {
      addOrder: false,
      getOrders: false,
      saleOpprotunity: false,
      reminder: false,
      getProducts: false,
      finance: false,
      getCustomers: false,
      getEmployees: false,
      getDiscounts: false,
      getAllSaleOpprotunity: false,
      getLeads: false
    },
  },

  setting: { type: Object }, // {
  // order: {
  //     preSms: { text: config.addOrderSms, status: false },
  //     postDeliverySms: { text: "" , status: false },
  //     postCustomerSms: { text: config.deliveryAcknowledgeSms , status: false }
  // }
});

User.pre("validate", function (next) {
  this.username = this.get("mobile");
  next();
});

User.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  bcrypt.hash(this.password, config.salt, (err, hash) => {
    this.password = hash;
    next();
  });
});

User.plugin(timestamps);

module.exports = mongoose.model("User", User);
