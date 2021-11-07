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
            type: { type: Number },  // 0 -> formal , 1 -> informal
            createdAt: { type: Date },
            expireTime: { type: Date },
            createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
        }]
    },
    financialApproval: {
        type: Object,
        default: {
            status: { type: Number, default: 0 }, // 0->no info, 1-> approved, 2->failed
            acceptedAt: { type: Date },
            acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' }
        }
    },
    sellers: [{
        _id: false, 
        id: { type: Schema.Types.ObjectId, ref: 'User' },
        active: { type: Boolean }
    }],
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    seller: { type: Schema.Types.ObjectId, ref: 'Seller' },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
    address: { type: String },
    readyTime: { type: Date },
    documents: [{ _id: false, name: String, key: { type: String, unique: true }, location: String, size: Number, fileType: String }],
    status: { type: Number, default: 0 },
    provider: { type: Schema.Types.ObjectId, ref: 'User' },
    employee: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String }
});

Order.plugin(timestamps);

module.exports = mongoose.model('Order', Order);