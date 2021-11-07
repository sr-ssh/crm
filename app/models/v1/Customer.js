let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

let Customer = new Schema({
    active: { type: Boolean, default: true },
    family: { type: String, required: true },
    username: { type: String, required: true, sparse: true },
    phoneNumber: { type: String, required: true, sparse: true },
    mobile: { type: String },
    birthday: { type: Date },
    company: { type: String },
    lastAddress: { type: String },
    order: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    failOrders : { type: Number, default: 0 },
    successfullOrders : { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    reminder: [{ type: Schema.Types.ObjectId, ref: 'Reminder' }] ,
    nationalCard: Number,
    financialCode: Number,
    postalCode: Number,
    registerNo: Number
});

Customer.pre('validate', function (next) {
    this.username = this.get('phoneNumber');
    next()
})

Customer.plugin(timestamps);

module.exports = mongoose.model('Customer', Customer);