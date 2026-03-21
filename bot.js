const mineflayer = require('mineflayer');

let bot;
let reconnectTimer = null;
let reconnectAttempts = 0;

const botConfig = {
  host: 'Herocraftx.aternos.me',
  port: 48357,
  username: 'MinecraftBot',
  auth: 'offline',
  version: '1.20.1',
  keepAlive: true
};

function delayForAttempt(attempt) {
  const base = 20000;
  const max = 120000;
  return Math.min(base * Math.pow(2, attempt), max);
}

function connect() {
  try {
    bot = mineflayer.createBot(botConfig);
  } catch {
    scheduleReconnect();
    return;
  }

  bot.once('spawn', () => {
    reconnectAttempts = 0;
    console.log('Bot joined');
  });

  bot.on('kicked', () => {
    scheduleReconnect();
  });

  bot.on('end', () => {
    scheduleReconnect();
  });

  bot.on('error', () => {});
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  const delay = delayForAttempt(reconnectAttempts);
  reconnectAttempts++;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

setTimeout(() => {
  connect();
}, 10000);
