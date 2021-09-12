let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

let Order = new Schema({
    active: { type: Boolean, default: true },
    products: {
        type: Array, default: [{
            _id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, default: 1 },
            sellingPrice: { type: String, required: true }
        }]
    },
    notes: {
        type: Array, default: [{
            text: { type: String },
            private: { type: Boolean, default: false },
            createdAt: { type: Date },
            writtenBy: { type: Schema.Types.ObjectId, ref: 'User' }
        }]
    },
    sharelink: {
        type: Array, default: [{
            _id: { type: String },
            createdAt: { type: Date },
            expireTime: { type: Date },
            createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
        }]
    },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    address: { type: String },
    readyTime: { type: Date },
    status: { type: Number, default: 0 },
    provider: { type: Schema.Types.ObjectId, ref: 'User' },
    employee: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String }
});

Order.plugin(timestamps);

module.exports = mongoose.model('Order', Order);