import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['text', 'audio', 'call', 'gif', 'image', 'video'],
        default: 'text',
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
