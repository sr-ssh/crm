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
      addOrder: false, // -> ثبت سفارش
      getOrders: false,  // -> سفارش ها
      saleOpprotunity: false,  // -> فرصت فروش ها
      getAllSaleOpprotunity: false,  // -> تمامی فرصت فروش ها
      reminder: false,  // -> یاد آوری
      getProducts: false,  // -> محصول ها
      ExcelProducts: false,  // -> بارگذاری و دانلود اکسل محصول ها
      finance: false,  // -> مالی
      currentCosts: false,  // -> هزینه های جاری
      getCustomers: false,  // -> مشتریان
      getExcelCustomers: false,  // -> دانلود اکسل مشتریان
      getEmployees: false,  // -> کارمندان
      employeeRequests : false,  // -> درخواست های کارمندان
      getDiscounts: false,  // -> تخفیف ها 
      leads: false,  // -> سرنخ 
      uploadExcelLeads: false,  // -> بارگذاری اکسل سرنخ
      addReceipt : false,  // -> ثبت فاکتور
      getReceipts: false,  // -> فاکتور ها 
      getSuppliers: false,  // -> تامین کننده ها 
      getExcelSuppliers: false,  // -> دانلود اکسل تامین کننده ها 
      getStock: false,  // -> مواد خام
      financialConfirmationOrder : false,  // -> تایید مالی سفارش 
      purchaseConfirmationInvoice: false   // -> تایید خرید فاکتور 

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
