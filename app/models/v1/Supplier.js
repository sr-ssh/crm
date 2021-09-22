let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

let Supplier = new Schema({
    active: { type: Boolean, default: true },
    family: { type: String, required: true },
    username: { type: String, required: true, sparse: true },
    mobile: { type: String, required: true, sparse: true },
    company: { type: String },
    receipts: [{ type: Schema.Types.ObjectId, ref: 'Receipt' }],
    failOrders : { type: Number, default: 0 },
    successfullOrders : { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});

Supplier.pre('validate', function (next) {
    this.username = this.get('mobile');
    next()
})

Supplier.plugin(timestamps);

module.exports = mongoose.model('Supplier', Supplier);