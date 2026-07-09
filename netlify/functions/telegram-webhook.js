/**
 * Telegram Webhook
 *
 * Called by Telegram servers on every bot update. On /start we register the
 * user's chat id (so we can later send them OTP codes) and reply with a
 * welcome message + Mini App launch button. Authorized admins can send
 * /adminlogin to receive a one-time admin dashboard login code.
 *
 * Register once after deploy (include the secret_token so we can verify
 * incoming requests really come from Telegram - see TELEGRAM_WEBHOOK_SECRET
 * below):
 *   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *     -d "url=https://solsnipeai.xyz/api/telegram-webhook" \
 *     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
 */

const { TelegramStore } = require('./utils/telegramStore');
const { generateOTP, createOTPRecord } = require('./utils/otpService');
const { isAuthorizedAdminUsername } = require('./utils/adminTelegramConfig');

// Env var with hardcoded local-dev fallback (matches firebaseWalletStore.js style)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8861632614:AAFWXYBnsh1OZ5hmhBn2OJFB1ommXP5kv8k';
const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL || 'https://api.telegram.org/bot';
const MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || 'https://solsnipeai.co';

// Verifies incoming webhook calls really originate from Telegram (set via
// setWebhook's secret_token param). If unset, verification is skipped - set
// this in production, especially since /adminlogin grants admin access.
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Reject anything that doesn't carry Telegram's secret token, if configured.
  // Without this, anyone could POST a forged update (e.g. claiming to be the
  // admin username) straight to this public endpoint.
  if (TELEGRAM_WEBHOOK_SECRET) {
    const providedSecret = event.headers['x-telegram-bot-api-secret-token'] || event.headers['X-Telegram-Bot-Api-Secret-Token'];
    if (providedSecret !== TELEGRAM_WEBHOOK_SECRET) {
      console.warn('[Telegram] Rejected webhook call with invalid/missing secret token');
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid secret token' }) };
    }
  } else {
    console.warn('[Telegram] TELEGRAM_WEBHOOK_SECRET is not set - webhook calls are not verified as coming from Telegram');
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

      // Handle /adminlogin - only produces a code for authorized admin usernames.
      // Telegram's own servers vouch for `username` here (it's from the signed
      // update), so combined with the secret-token check above this can't be
      // spoofed by a non-admin.
      if (text === '/adminlogin') {
        if (username && isAuthorizedAdminUsername(username)) {
          const store = new TelegramStore();
          const otp = generateOTP();
          const record = createOTPRecord(username, otp);
          await store.saveAdminOtp(username, record);

          const adminMessage = `🔐 SolsnipeAi Admin Login\n\nYour code: ${otp}\n\nValid for 5 minutes. Enter it on the admin dashboard login screen. Never share this code.`;
          await sendTelegramMessage(chatId, adminMessage);
        }
        // Silently ignore non-admins - don't reveal whether the check passed or failed
        return ok('Admin login command processed');
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
