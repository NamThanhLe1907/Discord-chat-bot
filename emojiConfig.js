module.exports = {
    status: {
        active: '🚀',
        inactive: '🛑',
        error: '❌',
        warning: '⚠️',
        success: '✅',
        loading: '⏳'
    },

    reactions: {
        loading: '⏳',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        thinking: ['💭', '🤔'] // Sử dụng mảng thay vì chuỗi
    },

    emotions: {
        happy: '😀😁😂🤣😃😄😎😋😊😉😆😅😍🥰😘😗😙'.split('').filter(e => e.trim() !== ''),
        sad: '😔😟😕🙁😞😢😥😭😓😪'.split('').filter(e => e.trim() !== ''),
        love: '😍🥰😘😗😙😚😻💋❤️💌'.split('').filter(e => e.trim() !== ''),
        angry: '😠😡🤬👿🥵😈💢😤👹👺'.split('').filter(e => e.trim() !== ''),
        surprised: '😲😳🥺😦😧😮😯😱'.split('').filter(e => e.trim() !== ''),
        funny: '😜😝😛🤑🤗🤡🤠😎'.split('').filter(e => e.trim() !== '')
    },
    
    activities: {
        sports: '⚽🏀🏈⚾🎾🏐🏉🎱🏓🏸'.split('').filter(e => e.trim() !== ''),
        music: '🎤🎧🎼🎹🥁🎷🎺🎸🎻'.split('').filter(e => e.trim() !== ''),
        games: '🎮🕹️👾🎲🎯🎳🎰🧩'.split('').filter(e => e.trim() !== ''),
        arts: '🎨🎭🎪🎬🎤🎧🎼'.split('').filter(e => e.trim() !== '')
    },

    objects: {
        tech: '💻📱⌨️🖥️🖨️🖱️💾📀📸'.split('').filter(e => e.trim() !== ''),
        food: '🍎🍐🍊🍋🍌🍉🍇🥝🍍🥥'.split('').filter(e => e.trim() !== ''),
        drinks: '☕🍵🍶🍾🍷🍸🍹🥃🥤'.split('').filter(e => e.trim() !== ''),
        vehicles: '🚗🚕🚌🚎🏎️🚓🚑🚒🚐'.split('').filter(e => e.trim() !== '')
    },

    symbols: {
        nature: '🌍🌎🌏🌋🏔️⛰️🌲🌳🌴'.split('').filter(e => e.trim() !== ''),
        weather: '☀️🌤⛅🌥☁️🌦🌧⛈🌩🌨'.split('').filter(e => e.trim() !== ''),
        time: '🕛🕧🕐🕜🕑🕝🕒🕞⏰⏳'.split('').filter(e => e.trim() !== ''),
        zodiac: '♈♉♊♋♌♍♎♏♐♑♒♓'.split('').filter(e => e.trim() !== '')
    },

    special: {
        celebration: '🎉🎊🎂🎁🎈🎀🎇🎆✨'.split('').filter(e => e.trim() !== ''),
        holiday: '🎄🎅🤶🎁❄️⛄🎆🎇'.split('').filter(e => e.trim() !== ''),
        fantasy: '👑🗡️🛡️🏰🐉🧙‍♀️🧝‍♂️🧚‍♀️'.split('').filter(e => e.trim() !== ''),
        magic: '✨🔮🎩🐇🕳️🎱♠️☠️👻👽♣️♥️♦️'.split('').filter(e => e.trim() !== ''),
        animal: '🐺🐶🐵🙊🙉🙈🐮🐱🦁🐷🐗🐯🦒🐭🐹🦊🦝🐰🐻🐻‍❄️🐨🐼🐸🦓🐴🫎🫏🦄🐔🐲🐽🐾🐒🦍🦧🦮🐕‍🦺🐩🐕🐈🐈‍⬛🐅🐆🐎🦌🦬🦏🦛🐂🐃🐄🐖🐏🐑🐐🐪🐫🦙🦘🦥🦨🦡🐘🦣🐁🐀🦔🐇🐿️🦫🦎🐊'.split('').filter(e => e.trim() !== '')
    },

    combinations: {
        positive: '🌟💫✨🌈💖🎯🏆💯✔️👍'.split('').filter(e => e.trim() !== ''),
        negative: '💔💣💥🌪️🚫❌⚠️‼️'.split('').filter(e => e.trim() !== ''),
        interactive: '🔄🎲🎯🎰🧩🎮🕹️👆👇'.split('').filter(e => e.trim() !== '')
    }
};