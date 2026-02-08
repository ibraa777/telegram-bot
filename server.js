const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🤖 Бот работает!');
});

app.listen(PORT, () => {
    console.log(`🌐 Сервер запущен на порту ${PORT}`);
});

// ========== ТВОЙ КОД БОТА НАЧИНАЕТСЯ ЗДЕСЬ ==========

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Используем переменные окружения
const token = process.env.BOT_TOKEN || '8368154450:AAG3rOERjFH2LtSSSn4bToPW1P4CbIcEeVg';
const CHANNEL_ID = process.env.CHANNEL_ID || '-1003527969684';
const CHAT_ID = process.env.CHAT_ID || '-1003807236755';
const CHANNEL_LINK = 'https://t.me/nakrutkabust07';
const CHAT_LINK = 'https://t.me/vzrkvzaum';
const BOT_NAME = 'Many_ssttars_bot';
const ADMINS = [5735614564];

const bot = new TelegramBot(token, { polling: true });
const DATA_FILE = 'users.json';
let users = {};

// ВСТАВЬ СЮДА ВЕСЬ КОД ИЗ ТВОЕГО bot.js ФАЙЛА
// Скопируй ВЕСЬ код начиная с "// Загрузка данных"
// и до конца файла
