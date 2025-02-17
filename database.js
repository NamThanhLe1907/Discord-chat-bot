const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true,
        index: true,
        validate: {
            validator: v => v && v.trim().length > 0,
            message: 'User ID không hợp lệ'
        }
    },
    role: {
        type: String,
        required: true,
        enum: ['system', 'user', 'assistant']
    },
    content: {
        type: String,
        required: true,
        validate: {
            validator: v => v && v.trim().length > 0,
            message: 'Nội dung không được trống'
        }
    },
    timestamp: { 
        type: Date, 
        default: Date.now,
        index: true
    }
});

const Chat = mongoose.model('Chat', chatSchema);

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ Đã kết nối MongoDB!");
    } catch (error) {
        console.error("❌ Lỗi kết nối MongoDB:", error.message);
        process.exit(1);
    }
}

async function saveChatHistory(userId, role, content) {
    try {
        const doc = {
            userId: userId?.toString()?.trim(),
            role: role?.toString()?.trim(),
            content: content?.toString()?.trim()
        };

        if (!doc.userId || !doc.role || !doc.content) {
            throw new Error(`Dữ liệu không hợp lệ: ${JSON.stringify(doc)}`);
        }

        await Chat.create(doc);
    } catch (error) {
        console.error("📦 Lỗi lưu dữ liệu:", error.message);
    }
}

async function getChatHistory(userId, limit = 10) {
    try {
        return await Chat.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean()
            .then(chats => chats.reverse().map(({ role, content }) => ({ role, content })));
    } catch (error) {
        console.error("📦 Lỗi đọc dữ liệu:", error.message);
        return [];
    }
}

module.exports = { connectDB, saveChatHistory, getChatHistory };