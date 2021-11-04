let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

let Seller = new Schema({
    active: { type: Boolean, default: true },
    family: { type: String, required: true },
    phone: { type: String, required: true, sparse: true },
    mobile: { type: String, required: true, sparse: true },
    company: { type: String, required: true, sparse: true },
    address: { type: String, required: true, sparse: true },
    order: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    failOrders : { type: Number, default: 0 },
    successfulOrders : { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    marketer: { type: Schema.Types.ObjectId, ref: 'User' },
    cardNumber: { type: Number, required: true, sparse: true },
    description: String
});


Seller.plugin(timestamps);

module.exports = mongoose.model('Seller', Seller);