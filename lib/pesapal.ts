import axios from "axios";

const BASE_URL = "https://cybqa.pesapal.com/pesapalv3/api";

export async function getAccessToken() {
  try {
    if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
      throw new Error("Pesapal credentials are not configured");
    }

    console.log("📡 Requesting Pesapal token...");

    const response = await axios.post(
      `${BASE_URL}/Auth/RequestToken`,
      {
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.data?.token) {
      throw new Error("No token received from Pesapal");
    }

    return response.data.token;
  } catch (error: any) {
    console.error("❌ Token error:", error.response?.data || error.message);
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

export async function getOrRegisterIPN(token: string): Promise<string> {
  try {
    // Check if IPN ID exists in environment
    if (process.env.PESAPAL_IPN_ID) {
      console.log("✅ Using existing IPN ID from .env");
      return process.env.PESAPAL_IPN_ID;
    }

    console.log("🔔 Registering new IPN...");

    const response = await axios.post(
      `${BASE_URL}/URLSetup/RegisterIPN`,
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/pesapal/ipn`,
        ipn_notification_type: "GET",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("✅ IPN registered successfully");
    console.log("IPN Response:", response.data);

    if (!response.data?.ipn_id) {
      console.error("❌ No IPN ID in response:", response.data);
      throw new Error("No IPN ID received");
    }

    const ipnId = response.data.ipn_id;
    console.log("📝 IPN ID:", ipnId);
    console.log("⚠️  Add this to your .env file:");
    console.log(`PESAPAL_IPN_ID=${ipnId}`);

    return ipnId;
  } catch (error: any) {
    console.error("❌ IPN registration error:", error.response?.data || error.message);
    throw new Error(`Failed to register IPN: ${error.message}`);
  }
}

export async function createOrder(token: string, orderData: any) {
  try {
    console.log("🛒 Creating Pesapal order...");
    
    if (!token) {
      throw new Error("Access token is required");
    }

    // IMPORTANT: Get or register IPN ID
    console.log("Getting IPN ID...");
    const ipnId = await getOrRegisterIPN(token);
    console.log("IPN ID to use:", ipnId);
    
    // Add IPN ID to order data
    const orderWithIpn = {
      ...orderData,
      notification_id: ipnId,
    };

    console.log("📦 Order payload:", JSON.stringify(orderWithIpn, null, 2));

    const response = await axios.post(
      `${BASE_URL}/Transactions/SubmitOrderRequest`,
      orderWithIpn,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("📨 Full Pesapal response:", JSON.stringify(response.data, null, 2));

    if (!response.data) {
      throw new Error("No response data from Pesapal");
    }

    if (response.data.error) {
      console.error("Pesapal API error:", response.data.error);
      throw new Error(`Pesapal error: ${response.data.error.message || JSON.stringify(response.data.error)}`);
    }

    if (!response.data.redirect_url) {
      console.error("❌ Response missing redirect_url:", response.data);
      throw new Error("No redirect URL received from Pesapal");
    }

    console.log("✅ Redirect URL:", response.data.redirect_url);
    return response.data;
  } catch (error: any) {
    console.error("❌ Order creation error:");
    console.error("Message:", error.message);
    console.error("Response:", error.response?.data);
    
    if (error.response?.data) {
      throw new Error(`Pesapal error: ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error(error.message || "Failed to create order");
  }
}