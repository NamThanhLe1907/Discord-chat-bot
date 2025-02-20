require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { 
    connectDB, 
    saveChatHistory, 
    getChatHistory, 
    addActiveUser, 
    removeActiveUser, 
    isActiveUser, 
    getUserChannel,
    getActiveUsers,
    getUserProfile,
    vectorSearch
} = require('./database');
const { chatWithAI } = require('./modelAI');
const { models } = require('./models'); // Import danh sách models
const emoji = require('./emojiConfig');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const MAX_HISTORY = 10;
let currentModel = "2"; // 🔹 Model mặc định là DeepSeek R1

client.once('ready', async () => {
    await connectDB();
    console.log(`${emoji.status.active} Bot đã sẵn sàng! Tag: ${client.user.tag}`);
    const activeUsers = await getActiveUsers();
  
    console.log(`📌 DEBUG: Có ${activeUsers.length} users trong activeUsers`);
    if (activeUsers.length > 0) {
        console.log(activeUsers);
    }

const allowedCategoryIds = ["1341118121565622393"];

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.guild) return;
  
    const displayName = message.member?.displayName || message.author.username;
    const userId = message.author.id;
    const username = message.author.username;
    const content = message.content.trim();
    const currentChannel = message.channel;
    const currentCategory = currentChannel.parentId;
    console.log(`📌 DEBUG: User chat ở channel ${currentChannel.id}, category: ${currentCategory}`);
    console.log(`📌 DEBUG: Nhận được tin nhắn từ ${message.author.username}: ${content}`);  // Log tin nhắn nhận được
    let targetChannel = currentChannel;
    // let loadingReaction = null;
    // let aiResponse = "⚠️ Đang gặp sự cố kỹ thuật...";

    if (!allowedCategoryIds.includes(currentCategory)) {
        const savedChannelId = await getUserChannel(userId);
        console.log(`📌 DEBUG: savedChannelId trong database = ${savedChannelId}`);
        // Nếu đang ở channel đã lưu
        if (savedChannelId === currentChannel.id) {
            // Cho phép tiếp tục chat
            return
        }
        else {
            const savedChannel = await client.channels.fetch(savedChannelId).catch(console.error);
            if (savedChannel) {
                // Gửi thông báo vào channel đã lưu và tag user
                savedChannel.send(`❌ <@${userId}>, Bạn không thể chat với bot ở channel khác. Hãy quay lại đây và dùng \`!start\`!`)
                .catch(err => console.error("Lỗi gửi tin nhắn:", err));
            } else {
                console.error("Không tìm thấy saved channel");
            }
            return;
        }
    }


  
    // Xử lý lệnh điều khiển
    if (content === '!start') {
        
        await addActiveUser(userId, username, currentChannel.id);
        return message.reply(`${emoji.status.success} Xin chào, **${displayName}**! Bot đã sẵn sàng chat với bạn.`);
    }

    // 🔹 Xử lý lệnh `!stop`
    if (content === '!stop') {
        await removeActiveUser(userId);
        return message.reply(`${emoji.status.inactive} **${displayName}**, bot đã ngừng chat với bạn.`);
    }

    // 🔹 Kiểm tra xem user có trong danh sách đang chat không
    const isUserActive = await isActiveUser(userId);
    if (!isUserActive) {
        console.warn(`❌ User ${userId} chưa kích hoạt bot với !start. Bỏ qua.`);
        return;if (!(await isActiveUser(userId))) return;
    }

    // Lấy thông tin tổng hợp từ lịch sử chat
    // const userSummary = await getUserSummary(userId);
    
    // 🔹 Lệnh hiển thị danh sách model
    if (content === "!model") {
        let modelList = "**Danh sách model có sẵn:**\n";
        for (const key in models) {
            modelList += `**${key}. ${models[key].name}**\n`;
        }
        modelList += "\n➡️ *Gõ `!model <số>` để chọn model AI.*";
        return message.reply(modelList);
    }

    // 🔹 Lệnh chọn model từ danh sách
    if (content.startsWith("!model ")) {
        const modelKey = content.split(" ")[1]; // Lấy số model
        if (models[modelKey]) {
            currentModel = modelKey;
            return message.reply(`✅ **Model đã được đổi thành: ${models[modelKey].name}**`);
        } else {
            return message.reply("❌ **Model không hợp lệ! Gõ `!model` để xem danh sách.**");
        }
    }   
  
    try {
        // Thêm reaction loading
        loadingReaction = await message.react(emoji.status.loading);
        let images = [];

        // 🖼️ Nếu tin nhắn có hình ảnh
        if (message.attachments.size > 0) {
            images = message.attachments.map(attachment => attachment.url);
            console.log(`📌 DEBUG: User gửi ảnh: ${images}`);
        }

        
        // // Xử lý lịch sử
        // const dbHistory = await getChatHistory(userId, MAX_HISTORY);
        // const fullHistory = [
        //     { 
        //         role: "system", 
        //         content: `${emoji.reactions.thinking} Bạn là người bạn đồng hành cùng **${displayName}**. Bạn hỗ trợ **${displayName}** về tất cả mọi vấn đề trong cuộc sống. Hãy trả lời rõ ràng và chi tiết từng bước cho **${displayName}** hiểu nhé. Hãy trả lời **${displayName}** bằng tiếng việt.!`
        //     },
        //     ...dbHistory.reverse(),
        //     { role: "user", content: content }
        // ];

        // // Gọi AI và xử lý response
        // const rawResponse = await chatWithAI(fullHistory, content, currentModel);
        // aiResponse = rawResponse || "❌ Không nhận được phản hồi";

                // Lấy thông tin đã học từ lịch sử
        const userProfile = await getUserProfile(userId);
        const similarHistory = await vectorSearch(userId, content, 2)

        // Tạo prompt thông minh dựa trên dữ liệu đã học
        const smartPrompt = `
            Bạn là trợ lý ảo của **${displayName}**.
            Dựa trên lịch sử gần đây: "${similarHistory.join('; ')}" 
            Dựa trên phân tích trước đây, bạn biết ${displayName} thường quan tâm đến: 
            ${userProfile?.commonTopics.join(', ')|| 'nhiều chủ đề khác nhau'}.

            Hãy trả lời câu hỏi dưới đây một cách tự nhiên và phù hợp với sở thích của họ:
            "${content}"
        `;
        

        // Gọi AI với prompt mới (KHÔNG dùng lịch sử)
        const rawResponse = await chatWithAI(
            [
                { role: "system", content: smartPrompt },
                { role: "user", content: content }
            ], 
            content, 
            currentModel,
            images
        );
        aiResponse = rawResponse || "❌ Không nhận được phản hồi";
        // Validate và lưu lịch sử
        if (typeof aiResponse === 'string' && aiResponse.trim().length > 0) {
            await saveChatHistory(userId, 'user', content);
            await saveChatHistory(userId, 'assistant', aiResponse);
            // Chia nhỏ tin nhắn nếu quá dài
            const responseParts = splitMessage(`${getContextEmoji(aiResponse)} ${aiResponse}`, 2000);
            for (const part of responseParts) {
                await message.reply(part);
            }

        } else {
            throw new Error('Phản hồi AI không hợp lệ');
        }
      
    } catch (error) {
        console.error('Lỗi chính:', error.stack);
        if (error.code === 50007) { // Lỗi không thể gửi tin nhắn riêng
            await message.reply(`${emoji.status.error} Bot không thể gửi tin nhắn riêng cho bạn. Vui lòng kiểm tra cài đặt quyền riêng tư của bạn.`);
        }else{
            await message.reply(`${emoji.status.error} Đã xảy ra lỗi: ${error.message}`);
        }
    } finally {
        // Cleanup reaction
        if (loadingReaction) {
            try {
                await loadingReaction.users.remove(client.user.id);
            } catch (cleanupError) {
                console.error('Lỗi cleanup:', cleanupError);
            }
        }
    }
    });


function splitMessage(text, maxLength) {
    const parts = [];
    while (text.length > maxLength) {
        let chunk = text.slice(0, maxLength);
        const lastNewline = chunk.lastIndexOf("\n");
        if (lastNewline > -1) {
            chunk = text.slice(0, lastNewline);
        }
        parts.push(chunk);
        text = text.slice(chunk.length).trim();
    }
    if (text.length > 0) {
        parts.push(text);
    }
    return parts;
}


/**
 * Chọn ngẫu nhiên một emoji từ danh sách.
 * @param {string[]} emojiList - Danh sách emoji.
 * @returns {string} - Một emoji ngẫu nhiên hoặc chuỗi rỗng nếu danh sách không tồn tại.
 */

/**
 * Trả về emoji phù hợp dựa trên nội dung tin nhắn.
 * @param {string} text - Nội dung tin nhắn.
 * @returns {string} - Một emoji phù hợp.
 */


client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const emojiResponse = getContextEmoji(message.content);
    
    // Chỉ thêm reaction nếu emoji hợp lệ
    if (emojiResponse && isValidEmoji(emojiResponse)) {
        try {
            await message.react(emojiResponse);
        } catch (error) {
            console.error('Lỗi thêm emoji:', error);
        }
    }
})
});
function getContextEmoji(text) {
    const lowerText = text.toLowerCase();
    let emojiList = [];

    if (lowerText.includes('chào')) emojiList = emoji.special.celebration;
    else if (lowerText.includes('cảm ơn')) emojiList = emoji.emotions.love;
    // ... các điều kiện khác
    else emojiList = emoji.special.magic;

    // Lọc các emoji hợp lệ (chuỗi không rỗng)
    const validEmojis = emojiList.filter(e => typeof e === "string" && e.trim().length > 0);
    
    // Fallback nếu không có emoji nào
    return validEmojis.length > 0 ? 
        randomEmoji(validEmojis) : 
        '❓'; // Emoji dự phòng
}

function randomEmoji(emojiList) {
    if (!Array.isArray(emojiList)) return '❓';
    const filtered = emojiList.filter(e => e && typeof e === "string");
    return filtered.length > 0 ? 
        filtered[Math.floor(Math.random() * filtered.length)] : 
        '❓';
}

function isValidEmoji(emoji) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    return emojiRegex.test(emoji);
}

client.login(process.env.TOKEN);

module.exports = { getContextEmoji };
