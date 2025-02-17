require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { connectDB, saveChatHistory, getChatHistory } = require('./database');
const { chatWithAI } = require('./modelAI');
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
let botActive = false;

client.once('ready', async () => {
    await connectDB();
    console.log(`${emoji.status.active} Bot đã sẵn sàng! Tag: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    const userId = message.author.id;
    const content = message.content.trim();
    let loadingReaction = null;
    let aiResponse = "⚠️ Đang gặp sự cố kỹ thuật...";

    // Xử lý lệnh điều khiển
    if (content === '!start') {
        botActive = true;
        return message.reply(`${emoji.status.active} Bot đã được kích hoạt!`);
    }
    
    if (content === '!stop') {
        botActive = false;
        return message.reply(`${emoji.status.inactive} Bot đã tắt!`);
    }
    
    if (!botActive) return;

    try {
        // Thêm reaction loading
        loadingReaction = await message.react(emoji.reactions.loading);

        // Xử lý lịch sử
        const dbHistory = await getChatHistory(userId, MAX_HISTORY);
        const fullHistory = [
            { 
                role: "system", 
                content: `${emoji.categories.tech} Bạn là trợ lý ảo vui tính. Trả lời ngắn gọn bằng tiếng Việt!`
            },
            ...dbHistory.reverse(),
            { role: "user", content: content }
        ];

        // Gọi AI và xử lý response
        const rawResponse = await chatWithAI(fullHistory);
        aiResponse = rawResponse || "❌ Không nhận được phản hồi";

        // Validate và lưu lịch sử
        if (typeof aiResponse === 'string' && aiResponse.trim().length > 0) {
            await saveChatHistory(userId, 'user', content);
            await saveChatHistory(userId, 'assistant', aiResponse);
            await message.reply(`${getContextEmoji(aiResponse)} ${aiResponse}`);
        } else {
            throw new Error('Phản hồi AI không hợp lệ');
        }

    } catch (error) {
        console.error('Lỗi chính:', error.stack);
        await message.reply(`${emoji.status.error} ${error.message}`);
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

function getContextEmoji(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('chào')) return emoji.reactions.greeting;
    if (lowerText.includes('cảm ơn')) return emoji.reactions.love;
    if (lowerText.includes('game')) return emoji.categories.game;
    return emoji.reactions.magic;
}

client.login(process.env.TOKEN);