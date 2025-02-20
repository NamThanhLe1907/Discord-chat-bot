const { getEmbedding } = require('./modelAI'); 
const mongoose = require('mongoose');

// ✅ 1. Định nghĩa schema MongoDB
const chatSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    role: { type: String, required: true, enum: ['system', 'user', 'assistant'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true }
});

const activeUserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    channelID: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const vectorSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true }, // ✅ Định dạng vector
    timestamp: { type: Date, default: Date.now }
});

const VectorModel = mongoose.model('Vector', vectorSchema);
const Chat = mongoose.model('Chat', chatSchema);
const ActiveUser = mongoose.model('ActiveUser', activeUserSchema);

// ✅ 2. Kết nối MongoDB
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

// ✅ 3. Quản lý danh sách user đang chat
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

async function removeActiveUser(userId) {
    try {
        await ActiveUser.deleteOne({ userId });
    } catch (error) {
        console.error("📦 Lỗi xóa user khỏi danh sách chat:", error.message);
    }
}

async function isActiveUser(userId) {
    return !!(await ActiveUser.findOne({ userId }));
}

async function getActiveUsers() {
    try {
        return await ActiveUser.find().lean();
    } catch (error) {
        console.error("📦 Lỗi lấy danh sách user đang chat:", error.message);
        return [];
    }
}

// ✅ 4. Lưu lịch sử chat & vector embeddings
async function saveChatHistory(userId, role, content) {
    try {
        const embedding = await getEmbedding(content);
        
        if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
            console.error("⚠️ Không thể tạo embedding, bỏ qua lưu vector.");
            return;
        }

        await Promise.all([
            Chat.create({ userId, role, content }),
            VectorModel.create({ userId, content, embedding: embedding[0] }) // ✅ Lưu đúng vector đầu tiên
        ]);

        console.log(`✅ Đã lưu chat + vector vào database cho user ${userId}`);
    } catch (error) {
        console.error("📦 Lỗi lưu dữ liệu:", error.message);
    }
}

// ✅ 5. Lấy lịch sử chat
async function getChatHistory(userId) {
    try {
        const chatHistory = await Chat.find({ userId })
            .sort({ timestamp: 1 }) // Sắp xếp từ cũ -> mới để giữ ngữ cảnh
            .lean();

        if (!chatHistory || chatHistory.length === 0) {
            console.warn(`⚠️ Không có lịch sử chat nào cho user ${userId}`);
            return { messages: [], fullText: "" };
        }

        // Gộp nội dung tin nhắn thành một đoạn văn bản
        const fullText = chatHistory.map(chat => chat.content).join("\n");

        return { messages: chatHistory, fullText };

    } catch (error) {
        console.error("❌ Lỗi lấy lịch sử chat:", error.message);
        return { messages: [], fullText: "" };
    }
}


// ✅ 6. Tìm kiếm user theo channel
async function getUserChannel(userId) {
    const user = await ActiveUser.findOne({ userId });
    console.log(`[DEBUG] User ${userId} có channelID trong DB: ${user?.channelID}`);
    return user ? user.channelID : null;
}

// ✅ 7. Tìm kiếm vector bằng cosine similarity
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (normA * normB);
}

async function vectorSearch(userId, query, k = 5) {
    try {
        console.log(`📌 [DEBUG] Bắt đầu tìm kiếm vector cho user ${userId}`);
        
        const queryEmbedding = await getEmbedding(query);
        if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0){
            console.warn("⚠️ Không thể tạo embedding, bỏ qua tìm kiếm vector.");
            return [];
        }

        const userVectors = await VectorModel.find({ userId }).lean();
        console.log(`📌 [DEBUG] Số lượng vectors trong DB: ${userVectors.length}`);
        
        if (userVectors.length === 0) {
            console.warn("⚠️ Không có vector nào trong database.");
            return [];
        }

        const results = userVectors.map(doc => {
            if (queryEmbedding[0].length !== doc.embedding.length) {
                console.error(`❌ Kích thước vector không khớp! Query: ${queryEmbedding[0].length}, DB: ${doc.embedding.length}`);
                return null;
            }
            return { 
                content: doc.content, 
                similarity: cosineSimilarity(queryEmbedding[0], doc.embedding) 
            };
        }).filter(res => res !== null); // Lọc ra các phần tử hợp lệ

        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, k)
            .map(res => res.content);
      
    } catch (error) {
        console.error("❌ Lỗi tìm kiếm vector:", error.message);
        return [];
    }
}

// ✅ 8. Phân tích lịch sử chat
function detectPreferences(topics) {
    if (!topics || topics.length === 0) return "Không có sở thích cụ thể.";
    return `Người dùng có xu hướng quan tâm đến: ${topics.join(", ")}.`;
}

function analyzeTopics(text) {
    const topics = [];

    if (text.includes('game')) topics.push('Game');
    if (text.includes('nhạc')) topics.push('Âm nhạc');
    if (text.includes('AI')) topics.push('Trí tuệ nhân tạo');
    if (text.includes('code')) topics.push('Lập trình');
    if (text.includes('chatbot')) topics.push('Chatbot');
    if (text.includes('công thức')) topics.push('Công thức Toán học');

    return [...new Set(topics)];
}

async function getUserProfile(userId) {
    try {
        const { fullText } = await getChatHistory(userId);

        if (!fullText || typeof fullText !== "string") {
            console.warn(`⚠️ Lịch sử chat của user ${userId} trống hoặc không hợp lệ.`);
            return { commonTopics: [], preferences: "Không có lịch sử chat." };
        }

        const topics = analyzeTopics(fullText);
        return {
            commonTopics: topics,
            preferences: detectPreferences(topics)
        };

    } catch (error) {
        console.error("❌ Lỗi phân tích lịch sử:", error.message);
        return { commonTopics: [], preferences: "Lỗi hệ thống, không thể phân tích." };
    }
}


// ✅ 9. Xuất các hàm
module.exports = { 
    connectDB, 
    saveChatHistory, 
    getChatHistory, 
    addActiveUser, 
    removeActiveUser, 
    isActiveUser, 
    getActiveUsers, 
    getUserChannel,
    getUserProfile,
    vectorSearch
};
