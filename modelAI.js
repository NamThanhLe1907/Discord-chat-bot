const fetch = require('node-fetch');
const { spawn } = require("child_process");
const { models } = require('./models'); 

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * 🔹 Gọi API AI để trò chuyện
 * @param {Array} history - Lịch sử tin nhắn (mảng tin nhắn trước đó)
 * @param {string} content - Nội dung tin nhắn mới
 * @param {string} modelKey - Model AI cần sử dụng (mặc định là "3")
 * @param {Array} images - Danh sách URL ảnh gửi kèm
 * @returns {Promise<string>} - Phản hồi từ AI
 */
async function chatWithAI(history, content, modelKey = "3", images = []) {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    const selectedModel = models[modelKey]?.modelId || models["2"].modelId;
    let formattedMessages = history;

    // 🔹 Nếu sử dụng Google Gemini Pro (Model 3) và có ảnh
    if (modelKey === "3" && images.length > 0) {
        formattedMessages = [
            {
                role: "user",
                content: [
                    { type: "text", text: content },
                    ...images.map(url => ({ type: "image_url", image_url: { url } }))
                ]
            }
        ];
    } else {
        formattedMessages.push({ role: "user", content: content });
    }

    while (retryCount < MAX_RETRIES) {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: formattedMessages,
                    temperature: 0.5,
                    max_tokens: 4096
                }),
                timeout: 20000
            });

            const data = await response.json();
            console.log('📌 API Response:', JSON.stringify(data, null, 2));
            
            if (!data?.choices?.[0]?.message?.content) {
                throw new Error(`❌ Lỗi response từ AI: ${JSON.stringify(data)}`);
            }

            return data.choices[0].message.content;

        } catch (error) {
            retryCount++;
            
            if (error.response?.status === 429) {
                const waitTime = Math.pow(2, retryCount) * 10000;
                console.log(`⏳ Rate limited. Retry ${retryCount} in ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            console.error('❌ Lỗi API AI:', error);
            if (retryCount === MAX_RETRIES) {
                return "🔧 Hệ thống đang bảo trì, vui lòng thử lại sau!";
            }
        }
    }
    return "⏳ Server đang quá tải, thử lại sau...";
}



/**
 * 🔹 Gọi `embedder.py` để tạo vector embeddings
 * @param {Array|string} texts - Văn bản cần tạo embeddings (1 chuỗi hoặc danh sách chuỗi)
 * @returns {Promise<Array>} - Embeddings trả về từ Python
 */
function getEmbedding(texts) {
    return new Promise((resolve, reject) => {
        const py = spawn("python3", ["embedder.py"]);

        let data = "";
        let errorData = "";

        console.log("📌 [DEBUG] Bắt đầu gọi Python embedding...");

        py.stdout.on("data", (chunk) => {
            data += chunk;
            //console.log("📥 [DEBUG] Python stdout:", chunk.toString());
        });

        py.stderr.on("data", (chunk) => {
            errorData += chunk;
            //console.error("❌ [DEBUG] Python stderr:", chunk.toString());
        });

        py.on("close", (code) => {
            console.log(`📌 [DEBUG] Python process exited with code ${code}`);

            if (code !== 0 || errorData) {
                console.error("❌ Python Error:", errorData);
                reject(new Error(`Python process exited with error: ${errorData}`));
                return;
            }

            try {
                const result = JSON.parse(data.trim());
                if (result.error) {
                    reject(new Error(`Python Error: ${result.error}`));
                } else {
                    //console.log("✅ [DEBUG] Embedding nhận được:", result);
                    resolve(result);
                }
            } catch (err) {
                console.error("❌ [DEBUG] JSON parse error:", err);
                reject(new Error("Invalid JSON response from Python."));
            }
        });

        // 🔹 Kiểm tra dữ liệu đầu vào trước khi gửi
        if (!texts || (Array.isArray(texts) && texts.length === 0)) {
            console.error("⚠️ Dữ liệu đầu vào rỗng!");
            reject(new Error("No input data provided."));
            return;
        }

        const inputData = JSON.stringify(Array.isArray(texts) ? texts : [texts]);
        console.log("📤 [DEBUG] Gửi dữ liệu vào Python:", inputData);
        py.stdin.write(inputData); // 🔹 Gửi JSON vào stdin của Python
        py.stdin.end();
    });
}

// 🔹 Xuất module
module.exports = { chatWithAI, getEmbedding };
