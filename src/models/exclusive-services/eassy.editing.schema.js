const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const essayediting = new mongoose.Schema({
    essaytype: {
        type: String,
        required: true,
        trim: true,
    },
    essayfile: {
        type: String,
        required: true,
        trim: true,
    },
    instructions: {
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
    }
    
}, { timestamps: true });

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_APT_SECRET
});

// Method to verify payment
essayediting.statics.verifyPayment = function(paymentDetails) {
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

const essay = mongoose.model('essay payment', essayediting);

module.exports = essay;
