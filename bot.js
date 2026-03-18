const mineflayer = require('mineflayer');

let bot;
let reconnectAttempts = 0;
let reconnectTimeout = null;

const MAX_DELAY = 60000;
const INITIAL_DELAY = 30000;

const botConfig = {
  host: 'Herocraftx.aternos.me',
  port: 48357,
  username: 'Player123',
  auth: 'offline',
  version: false
};

function getDelay() {
  return Math.min(INITIAL_DELAY * Math.pow(2, reconnectAttempts), MAX_DELAY);
}

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

function setupBot() {

  bot.once('spawn', () => {
    console.log('Bot joined');
    reconnectAttempts = 0;

    // Anti AFK
    setInterval(() => {
      if (!bot.entity) return;

      if (Math.random() < 0.5) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 200);
      }

    }, 40000);

    // Look around
    setInterval(() => {
      if (!bot.entity) return;

      const yaw = bot.entity.yaw + (Math.random() - 0.5);
      bot.look(yaw, bot.entity.pitch);

    }, 25000);

  });

  bot.on('kicked', (reason) => {
    console.log('Kicked:', reason);
    reconnect();
  });

  bot.on('end', () => {
    console.log('Disconnected');
    reconnect();
  });

  bot.on('error', (err) => {
    console.log('Error:', err.message);
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    if (message === 'hi') {
      bot.chat('Hello');
    }
  });
}

console.log('Starting bot...');
createBot();
