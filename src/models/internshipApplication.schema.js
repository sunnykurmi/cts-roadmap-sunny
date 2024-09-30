const mongoose = require('mongoose');

const internshipApplicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    mode: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    contact: {
        type: String,
        required: true,
        trim: true,
    },
    dateofbirth: {
        type: String,
        required: true,
        trim: true,
    },
    classGrade: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    income: {
        type: String,
        required: true,
        trim: true,
    },
    board: {
        type: String,
        required: true,
        trim: true,
    },
    dreamuniversity: {
        type: String,
        required: true,
        trim: true,
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    skills: {
        type: [],
        required: true,
    },
    ecs: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt:{
        type: Date,
        default: Date.now,
        expires: '30d'
    }
}, { timestamps: true });

module.exports = mongoose.model('InternshipApplication', internshipApplicationSchema);