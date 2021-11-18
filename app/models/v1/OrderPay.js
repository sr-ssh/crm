let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

let OrderPay = new Schema({
    active: { type: Boolean, default: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    paid: { type: Boolean, default: false },
    authority: { type: String, unique: true, sparse: true },
    amount: { type: Number }
});

OrderPay.plugin(timestamps);

module.exports = mongoose.model('OrderPay', OrderPay);
