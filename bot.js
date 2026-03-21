const mineflayer = require('mineflayer');

let bot;
let reconnectTimer = null;
let reconnectAttempts = 0;

const botConfig = {
  host: 'Herocraftx.aternos.me',
  port: 48357,
  username: 'MinecraftBot',
  auth: 'offline',
  version: false
};

function delayForAttempt(attempt) {
  const base = 15000;
  const max = 60000;
  return Math.min(base * Math.pow(2, attempt), max);
}

function clearBot() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    if (bot) bot.removeAllListeners();
  } catch {}
}

function connect() {
  clearBot();

  try {
    bot = mineflayer.createBot(botConfig);
  } catch (err) {
    scheduleReconnect();
    return;
  }

  bot.once('spawn', () => {
    reconnectAttempts = 0;
    console.log('Bot spawned');
  });

  bot.on('kicked', (reason) => {
    console.log('Kicked:', reason);
    scheduleReconnect();
  });

  bot.on('end', () => {
    console.log('Disconnected');
    scheduleReconnect();
  });

  bot.on('error', (err) => {
    console.log('Error:', err.message);
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  const delay = delayForAttempt(reconnectAttempts);
  reconnectAttempts += 1;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

console.log('Starting bot...');
connect();
