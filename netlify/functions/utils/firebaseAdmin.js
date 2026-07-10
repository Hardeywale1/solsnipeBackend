/**
 * Shared firebase-admin SDK initializer.
 *
 * Replaces the old REST-API-with-public-key pattern (FirebaseWalletStore /
 * TelegramStore used to build their own https://firestore.googleapis.com
 * requests authenticated only with a public FIREBASE_API_KEY). The Admin SDK
 * authenticates with a real service-account credential and bypasses Firestore
 * Security Rules entirely, which is what lets those rules be locked down to
 * `allow read, write: if false;` without breaking the app.
 *
 * Set FIREBASE_SERVICE_ACCOUNT to the full JSON key downloaded from
 * Firebase Console -> Project Settings -> Service Accounts -> Generate New
 * Private Key (either as one line or Netlify's multi-line env value).
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT is not set. Generate a service account key in ' +
      'Firebase Console (Project Settings > Service Accounts > Generate New ' +
      'Private Key) and set its JSON as the FIREBASE_SERVICE_ACCOUNT env var.'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (error) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${error.message}`);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

module.exports = { admin, db };
