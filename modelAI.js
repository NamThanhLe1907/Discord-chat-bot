const axios = require('axios');
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function chatWithAI(history,content) {
    const MAX_RETRIES = 3;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES) {
        try {
            const response = await axios.post(API_URL, {
                model: "deepseek/deepseek-r1:free",
                messages: history,content,
                temperature: 0.7,
                max_tokens: 10000
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    // "HTTP-Referer": process.env.WEBSITE_URL,
                    // "X-Title": "Discord AI Assistant"
                },
                timeout: 20000
            });

            // Debug logging
            console.log('API Response:', JSON.stringify({
                status: response.status,
                data: response.data
            }, null, 2));

            if (!response.data?.choices?.[0]?.message?.content) {
                throw new Error(`Cấu trúc response lỗi: ${JSON.stringify(response.data)}`);
            }

            return response.data.choices[0].message.content;

        } catch (error) {
            retryCount++;
            
            // Xử lý rate limit
            if (error.response?.status === 429) {
                const waitTime = Math.pow(2, retryCount) * 3000;
                console.log(`⏳ Rate limited. Retry ${retryCount} in ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            console.error('Lỗi API:', {
                attempt: retryCount,
                code: error.code,
                status: error.response?.status,
                message: error.message
            });

            if (retryCount === MAX_RETRIES) {
                return "🔧 Đang bảo trì hệ thống, thử lại sau nhé!";
            }
        }
    }
    return "⏳ Server đang quá tải, thử lại sau...";
}

module.exports = { chatWithAI };