const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const PortfolioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    livelink: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    purchased: {
        type: Number,
        default: 0,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    video: {
        type: Object,
        default: {
            fileId: "",
            url: "",
        },
    },
}, { timestamps: true });

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_APT_SECRET
});

// Method to create an order
PortfolioSchema.methods.createOrder = async function() {
    const options = {
        amount: this.price * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: `receipt_${this._id}`
    };

    try {
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        throw new Error('Error creating Razorpay order: ' + error.message);
    }
};

// Method to verify payment
PortfolioSchema.statics.verifyPayment = function(paymentDetails) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
    const hmac = crypto.createHmac('sha256', razorpay.key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === razorpay_signature;
};

const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

module.exports = Portfolio;