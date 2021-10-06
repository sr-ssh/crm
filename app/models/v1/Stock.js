let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

let Stock = new Schema({
    active: { type: Boolean, default: true },
    name: { type: String, required: true },
    amount: { type: Number, default: 0 },
    description: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User' }
});

Stock.plugin(timestamps);

module.exports = mongoose.model('Stock', Stock);