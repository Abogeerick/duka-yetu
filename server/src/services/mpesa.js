import axios from 'axios';

const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const LIVE_URL = 'https://api.safaricom.co.ke';

function getBaseUrl() {
  return process.env.MPESA_ENV === 'live' ? LIVE_URL : SANDBOX_URL;
}

/**
 * Generate OAuth access token from Daraja API
 */
export async function getAccessToken() {
  const url = `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const { data } = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  return data.access_token;
}

/**
 * Generate the password for STK push
 * Password = Base64(Shortcode + Passkey + Timestamp)
 */
function generatePassword(timestamp) {
  const str = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(str).toString('base64');
}

/**
 * Get current timestamp in format YYYYMMDDHHmmss
 */
function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Initiate STK Push (Lipa na M-Pesa Online)
 *
 * @param {string} phone - Customer phone (254XXXXXXXXX format)
 * @param {number} amount - Amount in KES
 * @param {string} accountRef - Reference (e.g., order number)
 * @returns {Object} Daraja API response
 */
export async function initiateSTKPush(phone, amount, accountRef) {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = generatePassword(timestamp);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerBuyGoodsOnline',
    Amount: Math.round(amount),
    PartyA: phone,
    PartyB: process.env.MPESA_TILL_NUMBER || process.env.MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: `Payment for ${accountRef}`,
  };

  const url = `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`;
  const { data } = await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}

/**
 * Query the status of an STK push transaction
 */
export async function querySTKStatus(checkoutRequestId) {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const password = generatePassword(timestamp);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const url = `${getBaseUrl()}/mpesa/stkpushquery/v1/query`;
  const { data } = await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}
