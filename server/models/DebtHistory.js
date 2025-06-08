const mongoose = require('mongoose');

const debtHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  changeAmount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['increase', 'decrease'],
    required: true
  },
  note: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('DebtHistory', debtHistorySchema);
