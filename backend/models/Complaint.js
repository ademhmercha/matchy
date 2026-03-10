import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in_review', 'resolved', 'rejected'],
        default: 'pending',
    },
    adminResponse: {
        type: String,
        default: '',
    },
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
