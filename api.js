const fetch = require('node-fetch');

async function getSoundCloudClientID() {
    try {
        const res = await fetch('https://api-v2.soundcloud.com/explore');
        const data = await res.text();
        const match = data.match(/client_id=([\w-]+)/);
        if (match) {
            console.log('✅ Client ID:', match[1]);
        } else {
            console.log('❌ Không tìm thấy Client ID');
        }
    } catch (error) {
        console.error('Lỗi:', error);
    }
}

getSoundCloudClientID();
