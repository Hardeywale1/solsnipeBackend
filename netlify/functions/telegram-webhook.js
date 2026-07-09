/**
 * Telegram Webhook
 *
 * Called by Telegram servers on every bot update. On /start we register the
 * user's chat id (so we can later send them OTP codes) and reply with a
 * welcome message + Mini App launch button.
 *
 * Register once after deploy:
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://solsnipeai.xyz/api/telegram-webhook"
 */

const { TelegramStore } = require('./utils/telegramStore');

// Env var with hardcoded local-dev fallback (matches firebaseWalletStore.js style)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8861632614:AAFWXYBnsh1OZ5hmhBn2OJFB1ommXP5kv8k';
const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL || 'https://api.telegram.org/bot';
const MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'https://solsnipeai.co';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const update = JSON.parse(event.body || '{}');

    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const username = message.from.username ? `@${message.from.username}` : null;
      const firstName = message.from.first_name || 'there';
      const text = message.text || '';

      console.log(`[Telegram] ${username || 'Unknown'}: ${text}`);

      // Save chat-id mapping for this user so we can send them OTP codes later
      if (username) {
        const store = new TelegramStore();
        await store.saveTelegramChatId(username, chatId);
      }

      // Handle /start
      if (text === '/start' && username) {
        const welcomeMessage = `👋 Welcome to SolsnipeAi, ${firstName}!\n\nTap below to open the app and connect your wallet.`;
        await sendTelegramMessageWithButtons(chatId, welcomeMessage, [
          [{ text: '🚀 Open SolsnipeAi', web_app: { url: MINI_APP_URL } }]
        ]);
        return ok('Start command processed');
      }

      // Handle /help
      if (text === '/help' && username) {
        const helpMessage = [
          '📖 SolsnipeAi Bot Help',
          '',
          'Commands:',
          '/start - Open the app and register',
          '/help - Show this help message',
          '',
          'How to authenticate:',
          '1. Open the SolsnipeAi app and click Connect',
          "2. You'll receive a 6-digit code here",
          '3. Enter that code in the app to verify'
        ].join('\n');
        await sendTelegramMessage(chatId, helpMessage);
        return ok('Help command processed');
      }
    }

    return ok('Webhook processed');
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Return 200 so Telegram does not retry
    return ok('Webhook received');
  }
};

function ok(message) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, message })
  };
}

/**
 * Send a plain text message via the bot
 */
async function sendTelegramMessage(chatId, text) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    if (!response.ok) {
      console.error('Failed to send message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

/**
 * Send a message with an inline keyboard
 */
async function sendTelegramMessageWithButtons(chatId, text, buttons) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: { inline_keyboard: buttons }
      })
    });
    if (!response.ok) {
      console.error('Failed to send message with buttons:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Telegram message with buttons:', error);
  }
}
