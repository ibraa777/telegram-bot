const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// ТВОЙ ТОКЕН
const token = '8368154450:AAG3rOERjFH2LtSSSn4bToPW1P4CbIcEeVg';

// Настройки
const CHANNEL_ID = '-1003527969684';
const CHANNEL_LINK = 'https://t.me/nakrutkabust07';
const CHAT_ID = '-1003807236755';
const CHAT_LINK = 'https://t.me/vzrkvzaum';
const BOT_NAME = 'Many_ssttars_bot';
const ADMINS = [5735614564]; // ТОЛЬКО ТЫ

const bot = new TelegramBot(token, { polling: true });
const DATA_FILE = 'users.json';
let users = {};

// Загрузка данных
if (fs.existsSync(DATA_FILE)) {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        if (data.trim()) {
            users = JSON.parse(data);
            // Добавляем referralList для старых пользователей
            for (const userId in users) {
                if (users[userId] && !users[userId].referralList) {
                    users[userId].referralList = [];
                }
            }
            console.log(`✅ Загружено ${Object.keys(users).length} пользователей`);
        }
    } catch(e) {
        console.log('❌ Ошибка загрузки данных:', e.message);
        users = {};
    }
}

// Сохранение данных
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
    } catch(e) {
        console.log('❌ Ошибка сохранения:', e.message);
    }
}

// Проверка подписки
async function checkSubscription(userId) {
    try {
        const channelMember = await bot.getChatMember(CHANNEL_ID, userId);
        const chatMember = await bot.getChatMember(CHAT_ID, userId);
        
        return !(channelMember.status === 'left' || channelMember.status === 'kicked' ||
                chatMember.status === 'left' || chatMember.status === 'kicked');
    } catch(e) {
        console.log('Ошибка проверки подписки:', e.message);
        return false;
    }
}

// Меню подписки
function showSubscriptionMenu(chatId, userId) {
    const text = `📢 ПОДПИШИСЬ ЧТОБЫ НАЧАТЬ!\n\n` +
                 `📢 Канал: ${CHANNEL_LINK}\n` +
                 `💬 Чат: ${CHAT_LINK}\n\n` +
                 `После подписки нажми "✅ Я подписался"`;
    
    const keyboard = {
        inline_keyboard: [
            [{ text: "📢 Подписаться на канал", url: CHANNEL_LINK }],
            [{ text: "💬 Вступить в чат", url: CHAT_LINK }],
            [{ text: "✅ Я подписался", callback_data: `check_sub_${userId || ''}` }]
        ]
    };
    
    bot.sendMessage(chatId, text, { reply_markup: keyboard });
}

// Главное меню
function showMainMenu(chatId, userId) {
    const user = users[userId];
    if (!user) return;
    
    const text = `⭐ РЕФЕРАЛЬНЫЙ БОТ\n\n` +
                 `💰 Баланс: ${user.stars || 0} ⭐\n` +
                 `👥 Рефералов: ${user.referrals || 0}\n\n` +
                 `🔗 Твоя ссылка:\nhttps://t.me/${BOT_NAME}?start=${userId}\n\n` +
                 `💎 +5 ⭐ за каждого друга\n\n` +
                 `💰 Вывод от 100 ⭐`;
    
    const keyboard = {
        inline_keyboard: [
            [{ text: "📤 Поделиться", url: `tg://msg_url?url=${encodeURIComponent(`https://t.me/${BOT_NAME}?start=${userId}`)}&text=Зарабатывай%20звёзды%20с%20ботом` }],
            [{ text: "💰 Баланс", callback_data: 'balance' }, { text: "🎁 Вывести", callback_data: 'withdraw' }],
            [{ text: "🎁 Ежедневный бонус", callback_data: 'daily' }],
            [{ text: "📋 Меню", callback_data: 'menu' }]
        ]
    };
    
    bot.sendMessage(chatId, text, { reply_markup: keyboard });
}

// /start
bot.onText(/\/start( (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const refCode = match[2];
    
    console.log(`📥 /start от ${userId}, реф-код: ${refCode}`);
    
    // Проверяем подписку
    const isSubscribed = await checkSubscription(userId);
    
    // Если не подписан - показываем меню подписки
    if (!isSubscribed) {
        showSubscriptionMenu(chatId, userId);
        return;
    }
    
    // СОЗДАЕМ ПОЛЬЗОВАТЕЛЯ ЕСЛИ ЕГО НЕТ
    if (!users[userId]) {
        users[userId] = {
            username: msg.from.username || `User${userId}`,
            stars: 0,
            referrals: 0,
            gotWelcomeBonus: false,
            lastDaily: null,
            referralList: []
        };
        console.log(`🆕 Новый пользователь: ${userId}`);
    }
    
    // ОБЕСПЕЧИВАЕМ, ЧТО ВСЕ ПОЛЯ ЕСТЬ
    if (!users[userId].referralList) users[userId].referralList = [];
    if (!users[userId].stars) users[userId].stars = 0;
    if (!users[userId].referrals) users[userId].referrals = 0;
    
    // ЕСЛИ ЕСТЬ РЕФЕРАЛЬНЫЙ КОД
    if (refCode && parseInt(refCode) !== userId) {
        const referrerId = parseInt(refCode);
        
        // Проверяем, есть ли такой пригласивший
        if (users[referrerId]) {
            // Обеспечиваем поля у пригласившего
            if (!users[referrerId].referralList) users[referrerId].referralList = [];
            if (!users[referrerId].stars) users[referrerId].stars = 0;
            if (!users[referrerId].referrals) users[referrerId].referrals = 0;
            
            // Проверяем, не начисляли ли уже за этого реферала
            if (!users[referrerId].referralList.includes(userId)) {
                // НАЧИСЛЯЕМ 5 ЗВЁЗД ПРИГЛАСИВШЕМУ
                users[referrerId].stars += 5;
                users[referrerId].referrals += 1;
                users[referrerId].referralList.push(userId);
                
                console.log(`✅ Начислено 5 ⭐ пользователю ${referrerId} за реферала ${userId}`);
                
                // Сохраняем данные
                saveData();
                
                // Уведомляем пригласившего
                bot.sendMessage(referrerId, 
                    `🎉 НОВЫЙ РЕФЕРАЛ!\n` +
                    `👤 @${users[userId].username || 'пользователь'}\n` +
                    `💰 +5 ⭐\n` +
                    `📊 Рефералов: ${users[referrerId].referrals}\n` +
                    `💵 Баланс: ${users[referrerId].stars} ⭐`
                );
            }
        }
    }
    
    // ПРИВЕТСТВЕННЫЕ 3 ЗВЕЗДЫ
    if (!users[userId].gotWelcomeBonus) {
        users[userId].stars += 3;
        users[userId].gotWelcomeBonus = true;
        bot.sendMessage(chatId, `🎉 +3 ⭐ за старт!`);
        saveData();
    }
    
    // ПОКАЗЫВАЕМ ГЛАВНОЕ МЕНЮ
    showMainMenu(chatId, userId);
});

// /menu
bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    console.log(`📋 /menu от ${userId}`);
    
    // Проверяем подписку
    const isSubscribed = await checkSubscription(userId);
    
    if (!isSubscribed) {
        showSubscriptionMenu(chatId, userId);
        return;
    }
    
    // Если пользователя нет - создаем
    if (!users[userId]) {
        users[userId] = {
            username: msg.from.username || `User${userId}`,
            stars: 0,
            referrals: 0,
            gotWelcomeBonus: false,
            lastDaily: null,
            referralList: []
        };
        saveData();
    }
    
    showMainMenu(chatId, userId);
});

// КНОПКИ
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    
    // КНОПКА "Я ПОДПИСАЛСЯ"
    if (query.data.startsWith('check_sub_')) {
        const isSubscribed = await checkSubscription(userId);
        
        if (isSubscribed) {
            bot.deleteMessage(chatId, query.message.message_id);
            
            // Если пользователя нет - создаем
            if (!users[userId]) {
                users[userId] = {
                    username: query.from.username || `User${userId}`,
                    stars: 0,
                    referrals: 0,
                    gotWelcomeBonus: false,
                    lastDaily: null,
                    referralList: []
                };
                // Приветственные 3 звезды
                users[userId].stars += 3;
                users[userId].gotWelcomeBonus = true;
                saveData();
                bot.sendMessage(chatId, `🎉 +3 ⭐ за старт!`);
            }
            
            // ПОКАЗЫВАЕМ МЕНЮ СРАЗУ
            showMainMenu(chatId, userId);
        } else {
            bot.answerCallbackQuery(query.id, {
                text: '❌ Ты еще не подписался на канал и/или чат!',
                show_alert: true
            });
        }
        return;
    }
    
    // КНОПКА "МЕНЮ"
    if (query.data === 'menu') {
        const isSubscribed = await checkSubscription(userId);
        
        if (!isSubscribed) {
            showSubscriptionMenu(chatId, userId);
            return;
        }
        
        showMainMenu(chatId, userId);
        return;
    }
    
    // Проверяем подписку для всех остальных действий
    const isSubscribed = await checkSubscription(userId);
    if (!isSubscribed) {
        bot.answerCallbackQuery(query.id, {
            text: '❌ Сначала подпишись на канал и чат!',
            show_alert: true
        });
        return showSubscriptionMenu(chatId, userId);
    }
    
    const user = users[userId];
    if (!user) {
        bot.answerCallbackQuery(query.id, { text: '❌ Ошибка! Нажми /menu', show_alert: true });
        return;
    }
    
    switch(query.data) {
        case 'balance':
            bot.answerCallbackQuery(query.id, {
                text: `💰 Баланс: ${user.stars || 0} ⭐\n👥 Рефералов: ${user.referrals || 0}\n🎁 За реферала: 5 ⭐\n💵 Вывод от: 100 ⭐`,
                show_alert: true
            });
            break;
            
        case 'withdraw':
            const userStars = user.stars || 0;
            if (userStars >= 100) {
                bot.sendMessage(chatId, `✅ Заявка на ${userStars} ⭐ отправлена! Ожидай связи.`);
                
                // Уведомление админам
                ADMINS.forEach(adminId => {
                    bot.sendMessage(adminId, 
                        `📤 НОВАЯ ЗАЯВКА НА ВЫВОД\n\n` +
                        `👤 @${user.username || 'без username'}\n` +
                        `🆔 ${userId}\n` +
                        `💰 ${userStars} ⭐\n` +
                        `👥 ${user.referrals || 0} рефералов`
                    );
                });
                
                user.stars = 0;
                saveData();
                showMainMenu(chatId, userId);
            } else {
                bot.sendMessage(chatId, `❌ Нужно 100 ⭐ для вывода!\n\nУ вас: ${userStars} ⭐\nОсталось: ${100 - userStars} ⭐`);
            }
            break;
            
        case 'daily':
            const now = new Date();
            const today = now.toDateString();
            
            if (user.lastDaily === today) {
                bot.answerCallbackQuery(query.id, {
                    text: `❌ Ты уже получал бонус сегодня! Приходи завтра!`,
                    show_alert: true
                });
            } else {
                user.stars += 3;
                user.lastDaily = today;
                saveData();
                
                bot.answerCallbackQuery(query.id, {
                    text: `🎉 +3 ⭐ за ежедневный бонус!\n\n💰 Теперь у тебя: ${user.stars} ⭐`,
                    show_alert: true
                });
                
                showMainMenu(chatId, userId);
            }
            break;
    }
});

// АДМИН ПАНЕЛЬ
bot.onText(/\/admin/, async (msg) => {
    const userId = msg.from.id;
    if (!ADMINS.includes(userId)) {
        return bot.sendMessage(msg.chat.id, '❌ Эта команда только для админа!');
    }
    
    const totalUsers = Object.keys(users).length;
    const totalStars = Object.values(users).reduce((sum, u) => sum + (u.stars || 0), 0);
    const today = new Date().toDateString();
    const activeToday = Object.values(users).filter(u => u.lastDaily === today).length;
    
    const adminText = `👑 АДМИН ПАНЕЛЬ\n\n` +
                     `👥 Всего пользователей: ${totalUsers}\n` +
                     `⭐ Всего звёзд в системе: ${totalStars}\n` +
                     `📅 Активных сегодня: ${activeToday}\n\n` +
                     `⚙️ Настройки:\n` +
                     `• За реферала: 5 ⭐\n` +
                     `• Мин. вывод: 100 ⭐\n` +
                     `• Ежедневный бонус: 3 ⭐\n` +
                     `• Приветственный: 3 ⭐`;
    
    const adminKeyboard = {
        inline_keyboard: [
            [{ text: "📊 Статистика", callback_data: 'admin_stats' }],
            [{ text: "🏆 Топ рефералов", callback_data: 'admin_top' }],
            [{ text: "📢 Рассылка всем", callback_data: 'admin_broadcast' }],
            [{ text: "👤 Поиск пользователя", callback_data: 'admin_find' }],
            [{ text: "📋 Главное меню", callback_data: 'menu' }]
        ]
    };
    
    bot.sendMessage(msg.chat.id, adminText, { reply_markup: adminKeyboard });
});

// Админ-кнопки
bot.on('callback_query', (query) => {
    const userId = query.from.id;
    if (!ADMINS.includes(userId)) return;
    
    switch(query.data) {
        case 'admin_stats':
            const totalUsers = Object.keys(users).length;
            const totalStars = Object.values(users).reduce((sum, u) => sum + (u.stars || 0), 0);
            const today = new Date().toDateString();
            const activeToday = Object.values(users).filter(u => u.lastDaily === today).length;
            const newToday = Object.values(users).filter(u => u.gotWelcomeBonus && 
                new Date().toDateString() === today).length;
            
            const statsText = `📊 ДЕТАЛЬНАЯ СТАТИСТИКА\n\n` +
                            `👥 Всего пользователей: ${totalUsers}\n` +
                            `⭐ Всего звёзд: ${totalStars}\n` +
                            `📅 Активных сегодня: ${activeToday}\n` +
                            `🆕 Новых сегодня: ${newToday}\n\n` +
                            `💰 Всего рефералов: ${Object.values(users).reduce((sum, u) => sum + (u.referrals || 0), 0)}`;
            
            bot.answerCallbackQuery(query.id, {
                text: statsText,
                show_alert: true
            });
            break;
            
        case 'admin_top':
            const topUsers = Object.entries(users)
                .sort((a, b) => (b[1].referrals || 0) - (a[1].referrals || 0))
                .slice(0, 10)
                .map(([id, user], index) => {
                    const username = user.username || `ID: ${id}`;
                    return `${index + 1}. ${username}: ${user.referrals || 0} реф. (${user.stars || 0} ⭐)`;
                })
                .join('\n');
            
            const topText = `🏆 ТОП-10 ПО РЕФЕРАЛАМ:\n\n${topUsers || 'Нет данных'}`;
            
            bot.sendMessage(query.message.chat.id, topText);
            break;
            
        case 'admin_broadcast':
            bot.sendMessage(query.message.chat.id, 
                `📢 РАССЫЛКА ВСЕМ ПОЛЬЗОВАТЕЛЯМ\n\n` +
                `Отправьте сообщение для рассылки (текст, фото, видео).\n` +
                `Для отмены отправьте /cancel`
            );
            
            users[userId] = users[userId] || {};
            users[userId].broadcastMode = true;
            saveData();
            break;
            
        case 'admin_find':
            bot.sendMessage(query.message.chat.id,
                `👤 ПОИСК ПОЛЬЗОВАТЕЛЯ\n\n` +
                `Отправьте ID пользователя или его @username\n` +
                `Для отмены отправьте /cancel`
            );
            
            users[userId] = users[userId] || {};
            users[userId].findMode = true;
            saveData();
            break;
    }
});

// Обработка админ-сообщений
bot.on('message', async (msg) => {
    const userId = msg.from.id;
    if (!ADMINS.includes(userId)) return;
    
    const user = users[userId] || {};
    
    // Режим рассылки
    if (user.broadcastMode) {
        if (msg.text === '/cancel') {
            delete user.broadcastMode;
            saveData();
            bot.sendMessage(msg.chat.id, '❌ Рассылка отменена');
            return;
        }
        
        const totalUsers = Object.keys(users).length;
        bot.sendMessage(msg.chat.id, `📤 Начинаю рассылку на ${totalUsers} пользователей...`);
        
        let success = 0;
        let failed = 0;
        const userList = Object.keys(users);
        
        for (let i = 0; i < userList.length; i++) {
            const uid = userList[i];
            try {
                await bot.copyMessage(uid, msg.chat.id, msg.message_id);
                success++;
            } catch(e) {
                failed++;
            }
            
            if (i % 20 === 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        bot.sendMessage(msg.chat.id,
            `✅ Рассылка завершена!\n\n` +
            `✅ Успешно: ${success}\n` +
            `❌ Ошибок: ${failed}`
        );
        
        delete user.broadcastMode;
        saveData();
        return;
    }
    
    // Режим поиска
    if (user.findMode) {
        if (msg.text === '/cancel') {
            delete user.findMode;
            saveData();
            bot.sendMessage(msg.chat.id, '❌ Поиск отменен');
            return;
        }
        
        const search = msg.text.trim();
        let foundUsers = [];
        
        for (const [id, userData] of Object.entries(users)) {
            const username = userData.username || '';
            if (id === search || 
                username.toLowerCase().includes(search.toLowerCase()) ||
                username === `User${search}`) {
                foundUsers.push({ id, ...userData });
            }
        }
        
        if (foundUsers.length === 0) {
            bot.sendMessage(msg.chat.id, '❌ Пользователь не найден');
        } else {
            let resultText = `🔍 РЕЗУЛЬТАТЫ ПОИСКА (${foundUsers.length}):\n\n`;
            
            foundUsers.forEach((u, index) => {
                resultText += `${index + 1}. @${u.username || 'без username'}\n`;
                resultText += `   ID: ${u.id}\n`;
                resultText += `   ⭐: ${u.stars || 0}\n`;
                resultText += `   👥 Рефералов: ${u.referrals || 0}\n`;
                resultText += `   📅 Последний бонус: ${u.lastDaily || 'никогда'}\n\n`;
            });
            
            bot.sendMessage(msg.chat.id, resultText);
        }
        
        delete user.findMode;
        saveData();
        return;
    }
});

// Команда /stats
bot.onText(/\/stats/, (msg) => {
    const userId = msg.from.id;
    if (!ADMINS.includes(userId)) return;
    
    const totalUsers = Object.keys(users).length;
    const totalStars = Object.values(users).reduce((sum, u) => sum + (u.stars || 0), 0);
    
    bot.sendMessage(msg.chat.id, `📊 Быстрая статистика:\n👥 Пользователей: ${totalUsers}\n⭐ Всего звёзд: ${totalStars}`);
});

// Обработка ошибок
process.on('uncaughtException', (error) => {
    console.log('⚠️ Критическая ошибка:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('⚠️ Необработанное обещание:', reason);
});

console.log('✅ БОТ ЗАПУЩЕН!');
console.log('⚡ Рефералка: +5 ⭐ за друга');
console.log('⚡ Приветственные: +3 ⭐');
console.log('⚡ Ежедневный бонус: +3 ⭐');
console.log('⚡ Вывод от: 100 ⭐');
console.log(`👑 Админ: ${ADMINS[0]}`);
console.log('📋 Меню доступно через: /menu или кнопку "Меню"');
