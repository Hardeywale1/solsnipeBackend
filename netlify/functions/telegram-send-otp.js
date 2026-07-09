/**
 * Send OTP via Telegram bot
 *
 * POST /telegram-send-otp
 * Body: { telegramUsername: "@alice" }
 * Returns: { success, otpSessionId, expiresIn, telegramUsername }
 *
 * The user must have sent /start to @SolsnipecoBot first so we have their chat id.
 */

const { generateOTP, createOTPRecord } = require('./utils/otpService');
const { TelegramStore } = require('./utils/telegramStore');
const { corsHeaders, parseBody } = require('./utils/response');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8861632614:AAFWXYBnsh1OZ5hmhBn2OJFB1ommXP5kv8k';
const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL || 'https://api.telegram.org/bot';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || '@SolsnipecoBot';

const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders };

function respond(statusCode, payload) {
  return { statusCode, headers: jsonHeaders, body: JSON.stringify(payload) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { success: false, error: 'Method not allowed' });
  }

  try {
    const { telegramUsername } = parseBody(event.body);

    if (!telegramUsername) {
      return respond(400, { success: false, error: 'Telegram username is required' });
    }
    if (!telegramUsername.startsWith('@')) {
      return respond(400, { success: false, error: 'Invalid Telegram username format (must start with @)' });
    }

    const store = new TelegramStore();

    // Get the user's chat id (set when they sent /start to the bot)
    const chatId = await store.getTelegramChatId(telegramUsername);
    if (!chatId) {
      return respond(404, {
        success: false,
        error: `User not found. Please send /start to ${BOT_USERNAME} first.`
      });
    }

    // Generate + store OTP
    const otp = generateOTP();
    const otpRecord = createOTPRecord(telegramUsername, otp);
    const otpSessionId = `${telegramUsername.replace('@', '')}_${Date.now()}`;
    await store.saveOtpRecord(otpSessionId, otpRecord);

    // Send OTP to the user's Telegram chat
    const message = `🔐 Your SolsnipeAi code is: ${otp}\n\nValid for 5 minutes.`;
    const sendResponse = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });

    if (!sendResponse.ok) {
      console.error('Telegram send failed:', await sendResponse.text());
      return respond(500, { success: false, error: 'Failed to send OTP via Telegram' });
    }

    return respond(200, {
      success: true,
      message: 'OTP sent successfully',
      otpSessionId,
      expiresIn: 300,
      telegramUsername
    });
  } catch (error) {
    console.error('Error in telegram-send-otp:', error);
    return respond(500, { success: false, error: error.message });
  }
};
