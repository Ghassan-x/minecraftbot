const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

let bot;
let reconnectAttempts = 0;
let isConnecting = false;
let reconnectTimeout = null;
let jumpInterval = null;
const MAX_RECONNECT_DELAY = 60000;
const INITIAL_DELAY = 5000;

const botConfig = {
  host: 'Herocraftx.aternos.me',
  port: 48357,
  username: 'MinecraftBot',
  auth: 'offline',
  version: false
};

function getReconnectDelay() {
  const delay = Math.min(INITIAL_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  return delay;
}

function createBot() {
  if (isConnecting) {
    console.log('Already attempting to connect, skipping...');
    return;
  }
  
  isConnecting = true;
  console.log(`Creating bot... (Attempt ${reconnectAttempts + 1})`);
  
  try {
    bot = mineflayer.createBot(botConfig);
    setupBotHandlers();
  } catch (err) {
    console.error('Failed to create bot:', err.message);
    isConnecting = false;
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  const delay = getReconnectDelay();
  reconnectAttempts++;
  
  console.log(`Reconnecting in ${delay / 1000} seconds...`);
  reconnectTimeout = setTimeout(() => {
    createBot();
  }, delay);
}

function setupBotHandlers() {
  bot.loadPlugin(pathfinder);
  
  bot.once('spawn', () => {
    reconnectAttempts = 0;
    isConnecting = false;
    
    console.log('Bot spawned successfully!');
    console.log(`Connected to ${bot.game.serverBrand || 'server'}`);
    console.log(`Minecraft version: ${bot.version}`);
    
    bot.physics.autojump = true;
    console.log('Auto-jump enabled! Bot will jump automatically when moving.');
    
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);
    
    if (jumpInterval) {
      clearInterval(jumpInterval);
    }
    jumpInterval = setInterval(() => {
      if (bot && bot.entity) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          if (bot) {
            bot.setControlState('jump', false);
          }
        }, 100);
      }
    }, 3000);
    console.log('Auto-jump every 3 seconds activated!');
    
    setTimeout(() => {
      if (bot && bot.entity) {
        const currentPos = bot.entity.position;
        const targetX = currentPos.x + 1000;
        const goal = new goals.GoalXZ(targetX, currentPos.z);
        bot.pathfinder.setGoal(goal, true);
        console.log(`Walking in +X direction from ${currentPos.x.toFixed(1)} towards ${targetX}`);
      }
    }, 2000);
  });
  
  bot.on('login', () => {
    console.log('Bot logged in successfully!');
    console.log(`Username: ${bot.username}`);
  });
  
  bot.on('chat', (username, message) => {
    try {
      if (username === bot.username) return;
      console.log(`<${username}> ${message}`);
      
      if (message === 'hi bot') {
        bot.chat('Hello! I am a bot created with mineflayer.');
      }
      
      if (message === 'jump') {
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
        }, 500);
      }
      
      if (message.startsWith('come')) {
        const player = bot.players[username];
        if (player && player.entity) {
          const target = player.entity.position;
          const goal = new goals.GoalNear(target.x, target.y, target.z, 1);
          bot.pathfinder.setGoal(goal);
          console.log(`Moving to ${username}...`);
        }
      }
      
      if (message === 'stop') {
        bot.pathfinder.setGoal(null);
        console.log('Stopped moving.');
      }
    } catch (err) {
      console.error('Chat error (ignored):', err.message);
    }
  });
  
  bot.on('health', () => {
    console.log(`Health: ${bot.health} | Food: ${bot.food}`);
  });
  
  bot.on('death', () => {
    console.log('Bot died! Respawning...');
  });
  
  bot.on('kicked', (reason) => {
    console.log(`Bot was kicked! Reason: ${reason}`);
    if (jumpInterval) {
      clearInterval(jumpInterval);
      jumpInterval = null;
    }
    isConnecting = false;
    scheduleReconnect();
  });
  
  bot.on('error', (err) => {
    console.error('Bot error:', err.message);
    if (jumpInterval) {
      clearInterval(jumpInterval);
      jumpInterval = null;
    }
    isConnecting = false;
    scheduleReconnect();
  });
  
  bot.on('end', () => {
    console.log('Bot disconnected from server.');
    if (jumpInterval) {
      clearInterval(jumpInterval);
      jumpInterval = null;
    }
    isConnecting = false;
    scheduleReconnect();
  });
}

console.log('Starting Minecraft bot...');
console.log(`Connecting to ${botConfig.host}:${botConfig.port}`);
console.log('Bot will automatically reconnect if disconnected.');
createBot();
