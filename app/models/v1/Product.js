let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

let Product = new Schema({
    active: { type: Boolean, default: true },
    name: { type: String, required: true },
    sellingPrice: { type: String , required: true},
    checkWareHouse: { type: Boolean, default: false},
    ingredients: [{ 
        _id: false,
        stock: { type: Schema.Types.ObjectId, ref: 'Stock' },
        amount: { type: Number, default: 1 } 
    }],
    description: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User' }
});

Product.plugin(timestamps);

module.exports = mongoose.model('Product', Product);