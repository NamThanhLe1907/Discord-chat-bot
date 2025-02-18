const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true,
        index: true
    },
    role: {
        type: String,
        required: true,
        enum: ['system', 'user', 'assistant']
    },
    content: {
        type: String,
        required: true
    },
    timestamp: { 
        type: Date, 
        default: Date.now,
        index: true
    }
});

const activeUserSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    displayName: {  // 🔹 Đảm bảo dùng `displayName` đúng với schema
        type: String, 
        required: true 
    },
    channelID: {
        type: String,
        required: true
      
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

const Chat = mongoose.model('Chat', chatSchema);
const ActiveUser = mongoose.model('ActiveUser', activeUserSchema);

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

// 🔹 Thêm user vào danh sách đang chat
async function addActiveUser(userId, displayName, channelId) {
    if (!channelId) {
        console.error(`❌ Lỗi: channelId không tồn tại khi thêm user ${userId}`);
        return;
    }
    try {
        console.log(`📌 DEBUG: Lưu user ${userId} vào activeUsers với channelId ${channelId}`);
        await ActiveUser.findOneAndUpdate(
            { userId },
            { displayName, channelID: channelId, timestamp: new Date() },
            { upsert: true, new: true }
        );
        console.log(`✅ addActiveUser: Đã lưu thành công user ${userId}`);
    } catch (error) {
        console.error("📦 Lỗi khi thêm user vào danh sách chat:", error.message);
    }
}



// 🔹 Xóa user khỏi danh sách đang chat (FIX LỖI)
async function removeActiveUser(userId) {
    try {
        await ActiveUser.deleteOne({ userId }); // ✅ Chỉ cần userId
    } catch (error) {
        console.error("📦 Lỗi xóa user khỏi danh sách chat:", error.message);
    }
}

// 🔹 Kiểm tra user có trong danh sách không
async function isActiveUser(userId) {
    return !!(await ActiveUser.findOne({ userId }));
}

// 🔹 Lấy danh sách tất cả user đang chat
async function getActiveUsers() {
    try {
        return await ActiveUser.find().lean();
    } catch (error) {
        console.error("📦 Lỗi lấy danh sách user đang chat:", error.message);
        return [];
    }
}

// 🔹 Lưu lịch sử chat
async function saveChatHistory(userId, role, content) {
    try {
        await Chat.create({ userId, role, content });
    } catch (error) {
        console.error("📦 Lỗi lưu dữ liệu:", error.message);
    }
}

// 🔹 Lấy lịch sử chat (TỐI ƯU)
async function getChatHistory(userId, limit = 10) {
    try {
        return await Chat.find({ userId })
            .sort({ timestamp: 1 }) // ✅ Sort tăng dần (không cần reverse)
            .limit(limit)
            .lean()
            .then(chats => chats.map(({ role, content }) => ({ role, content })));
    } catch (error) {
        console.error("📦 Lỗi đọc dữ liệu:", error.message);
        return [];
    }
}

// Thêm hàm phân tích lịch sử để trích xuất thông tin người dùng
async function getUserProfile(userId) {
    try {
        const history = await getChatHistory(userId, 100); // Lấy 100 tin nhắn gần nhất
        const profile = {
            frequentlyUsedWords: [],
            commonTopics: [],
            preferences: []
        };

        // Phân tích lịch sử để xây dựng profile
        history.forEach(({ role, content }) => {
            if (role === 'user') {
                // Ví dụ: Phát hiện từ khóa thường dùng
                const words = content.toLowerCase().split(/\s+/);
                profile.frequentlyUsedWords.push(...words);
                
                // Phát hiện chủ đề (ví dụ: game, âm nhạc)
                if (content.includes('game')) profile.commonTopics.push('game');
                if (content.includes('nhạc')) profile.commonTopics.push('âm nhạc');
                if (content.includes('AI')) profile.commonTopics.push('AI');
                if (content.includes('tool')) profile.commonTopics.push('tool');
                if (content.includes('formula, công thức')) profile.commonTopics.push('công thức');
                if (content.includes('toán')) profile.commonTopics.push('âm nhạc');
                if (content.includes('lịch sử')) profile.commonTopics.push('năm, year');
                if (content.includes('data')) profile.commonTopics.push('data');
            }
        });

        // Lọc các từ/cụm từ xuất hiện nhiều lần
        profile.frequentlyUsedWords = [...new Set(profile.frequentlyUsedWords)];
        profile.commonTopics = [...new Set(profile.commonTopics)];

        return profile;
    } catch (error) {
        console.error("📦 Lỗi phân tích lịch sử:", error.message);
        return null;
    }
}

async function getUserChannel(userId) {
    const user = await ActiveUser.findOne({ userId });
    console.log(`[DEBUG] User ${userId} có channelID trong DB: ${user?.channelID}`);
    return user ? user.channelID : null;
}

module.exports = { 
    connectDB, 
    saveChatHistory, 
    getChatHistory, 
    addActiveUser, 
    removeActiveUser, 
    isActiveUser, 
    getActiveUsers,  // ✅ Xuất thêm hàm lấy danh sách user
    getUserChannel,
    getUserProfile

};
