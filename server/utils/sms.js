const twilio = require("twilio");

const hasTwilioConfig =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER;

const normalizePhone = (value) => String(value || "").replace(/[^\d+]/g, "");

const sendPhoneOtpSms = async (phone, otpCode) => {
  if (!hasTwilioConfig) {
    throw new Error("SMS gateway is not configured");
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Your ColdStore Pro OTP is ${otpCode}. It is valid for 10 minutes.`,
    from: normalizePhone(process.env.TWILIO_PHONE_NUMBER),
    to: normalizePhone(phone).startsWith("+") ? normalizePhone(phone) : `+91${normalizePhone(phone)}`
  });
};

module.exports = { sendPhoneOtpSms, hasTwilioConfig };
