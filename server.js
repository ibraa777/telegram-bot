const TelegramBot = require('node-telegram-bot-api');

// ТВОЙ ТОКЕН
const TOKEN = '8438625108:AAGbY_8c8zNhxgh1P7UZkyeJdfDI48UJJ0A';

console.log('🤖 Запускаю бота...');

// Создаем бота
const bot = new TelegramBot(TOKEN, {polling: true});

// Когда кто-то напишет /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;
  
  bot.sendMessage(chatId, 
    `🎉 ПРИВЕТ, ${name}!\n\n✅ Бот работает!\n📞 Твой ID: ${chatId}\n\nПиши /help`
  );
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 
    '📚 Команды:\n/start - начало\n/help - помощь\n/test - тест\n/ping - проверить'
  );
});

// Команда /test
bot.onText(/\/test/, (msg) => {
  bot.sendMessage(msg.chat.id, '✅ Тест пройден! Бот жив!');
});

// Команда /ping
bot.onText(/\/ping/, (msg) => {
  bot.sendMessage(msg.chat.id, '🏓 Pong!');
});

// Когда приходит обычное сообщение (не команда)
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, `Ты написал: "${msg.text}"`);
  }
});

console.log('✅ Бот готов! Иди в Telegram и напиши /start своему боту');
