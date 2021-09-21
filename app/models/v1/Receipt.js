let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

let Receipt = new Schema({
    active: { type: Boolean, default: true },
    stock: {
        type: Array, default: [{
            _id: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
            quantity: { type: Number, default: 1 },
            price: { type: String, required: true }
        }]
    },
    note: {
        type: Object, default: {
            text: { type: String },
            private: { type: Boolean, default: false },
            createdAt: { type: Date },
            writtenBy: { type: Schema.Types.ObjectId, ref: 'User' }
        }
    },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    address: { type: String },
    status: { type: Number, default: 0 },
    provider: { type: Schema.Types.ObjectId, ref: 'User' },
    employee: { type: Schema.Types.ObjectId, ref: 'User' }
});

Receipt.plugin(timestamps);

module.exports = mongoose.model('Receipt', Receipt);