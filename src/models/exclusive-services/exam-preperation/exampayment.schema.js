const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const ExamTiming = require('./examtiming.schema');

const exampayment = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    score:{
        type: String,
    },
   exam_type: {
        type: String,
    },
    userid: {
        type:String,
        required: true
    },
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
exampayment.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_APT_SECRET
});

// Method to verify payment
exampayment.statics.verifyPayment =async function(paymentDetails) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
        const hmac = crypto.createHmac('sha256', razorpay.key_secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest('hex');
        return generatedSignature === razorpay_signature;
    } catch (error) {
        console.log("error verify payment :", error);
        return false;
    }
};

const exam_prep = mongoose.model('exam_prep_payment', exampayment);

module.exports = exam_prep;
