let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

let Lead = new Schema({
    active: { type: Boolean, default: true },
    family: { type: String, required: true },
    mobile: { type: String, required: true },
    description: { type: String },
    status: { type: Number, default: 0 },// 0 -> in proggress, 1 -> canceled, 2 -> accepted
    accepted: { type: Boolean, default: false },
    addUser: { type: Schema.Types.ObjectId, ref: 'User' }, // user who have added the lead
    acceptUser: { type: Schema.Types.ObjectId, ref: 'User' }, // user who have accepted the lead
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

Lead.plugin(timestamps);

module.exports = mongoose.model('Lead', Lead);