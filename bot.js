const mineflayer = require('mineflayer');

let bot;
let reconnectAttempts = 0;
let reconnectTimeout = null;

const MAX_DELAY = 60000;
const INITIAL_DELAY = 15000;

const botConfig = {
  host: 'Herocraftx.aternos.me',
  port: 48357,
  username: 'MinecraftBot',
  auth: 'offline',
  version: false
};

// حساب وقت إعادة الاتصال
function getDelay() {
  return Math.min(INITIAL_DELAY * Math.pow(2, reconnectAttempts), MAX_DELAY);
}

// إنشاء البوت
function createBot() {
  console.log(`Connecting... Attempt ${reconnectAttempts + 1}`);

  try {
    bot = mineflayer.createBot(botConfig);
    setupBot();
  } catch (err) {
    console.log('Create error:', err.message);
    reconnect();
  }
}

// إعادة الاتصال
function reconnect() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  const delay = getDelay();
  reconnectAttempts++;

  console.log(`Reconnecting in ${delay / 1000}s`);

  reconnectTimeout = setTimeout(() => {
    try {
      if (bot) {
        bot.removeAllListeners();
        bot.quit();
      }
    } catch {}

    createBot();
  }, delay);
}

// إعداد البوت
function setupBot() {

  bot.once('spawn', () => {
    console.log('✅ Bot joined!');
    reconnectAttempts = 0;

    // Anti AFK (قفز)
    setInterval(() => {
      if (!bot.entity) return;

      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 200);

    }, 30000);

    // حركة رأس
    setInterval(() => {
      if (!bot.entity) return;

      const yaw = bot.entity.yaw + (Math.random() - 0.5);
      bot.look(yaw, bot.entity.pitch);

    }, 20000);

  });

  bot.on('login', () => {
    console.log('🔐 Logged in');
  });

  bot.on('kicked', (reason) => {
    console.log('❌ Kicked:', reason);
    reconnect();
  });

  bot.on('end', () => {
    console.log('⚠️ Disconnected');
    reconnect();
  });

  bot.on('error', (err) => {
    console.log('Error:', err.message);
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    if (message === 'hi bot') {
      bot.chat('Hello!');
    }
  });
}

console.log('🚀 Starting bot...');
createBot();
