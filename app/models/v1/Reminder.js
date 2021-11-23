let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

let Reminder = new Schema({
    active:{ type: Boolean, default: true },
    title: { type: String , required: true },
    description: { type: String },
    date: { type: Date, required: true },
    orderReference: { type: Schema.Types.ObjectId, ref: 'Order' },
    leadReference: { type: Schema.Types.ObjectId, ref: 'Lead' },
    factorReference: { type: Schema.Types.ObjectId, ref: 'Receipt' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});


Reminder.plugin(timestamps);

module.exports = mongoose.model('Reminder', Reminder);