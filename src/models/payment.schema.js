const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        unique: true,
        sparse: true // Allow null values initially
    },
    signature: {
        type: String
    },
    portfolioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Portfolio',
        required: true
    },
    userid: {
        type:String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['created', 'paid', 'failed'],
        default: 'created'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expireAt: {
        type: Date,
        default: function() {
            return this.status === 'created' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined;
        }
    }
}, { timestamps: true });

// Create TTL index on expireAt field
PaymentSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const Payment = mongoose.model('portfolio-payment', PaymentSchema);

module.exports = Payment;