const axios = require("axios");

/**
 * Send WhatsApp Template Message via Meta Cloud API
 * @param {Object} params { phone, name, score }
 */
const sendWhatsApp = async ({ phone, name, score }) => {
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId || !phone) {
      console.warn("[WA] Config skip: Missing token, phoneId or student number.");
      return;
    }

    // 1. Normalize Phone (91 + 10 digits)
    let formattedPhone = phone.toString().replace(/\D/g, "");
    if (formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }

    // 2. Body Payload
    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "test_result_template",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: score.toString() }
            ]
          }
        ]
      }
    };

    // 3. API Call
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`[WA] Success: Message sent to ${formattedPhone}. MessageID: ${response.data.messages?.[0]?.id}`);
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error("[WA] Integration Error:", JSON.stringify(errorData));
    // Never throw errors to keep the main flow stable
  }
};

module.exports = sendWhatsApp;
