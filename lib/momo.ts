import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const BASE_URL = "https://sandbox.momodeveloper.mtn.com";
const SUBSCRIPTION_KEY = process.env.MTN_MOMO_SUBSCRIPTION_KEY;

let cachedApiUser: string | null = null;
let cachedApiKey: string | null = null;
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function createApiUser() {
  try {
    if (!SUBSCRIPTION_KEY) {
      throw new Error("MTN_MOMO_SUBSCRIPTION_KEY is not set in environment variables");
    }

    const userId = uuidv4();
    console.log("📝 Creating API User:", userId);

    await axios.post(
      `${BASE_URL}/v1_0/apiuser`,
      {
        providerCallbackHost: "localhost",
      },
      {
        headers: {
          "X-Reference-Id": userId,
          "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ API User created");
    return userId;
  } catch (error: any) {
    console.error("❌ Failed to create API user");
    console.error("Status:", error.response?.status);
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 401) {
      throw new Error("Invalid MTN MoMo subscription key. Please check your Collections API key in .env file");
    }
    
    throw new Error(`Failed to create API user: ${error.response?.data?.message || error.message}`);
  }
}

export async function createApiKey(apiUserId: string) {
  try {
    console.log("🔑 Creating API Key for user:", apiUserId);

    const response = await axios.post(
      `${BASE_URL}/v1_0/apiuser/${apiUserId}/apikey`,
      {},
      {
        headers: {
          "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        },
      }
    );

    console.log("✅ API Key created");
    return response.data.apiKey;
  } catch (error: any) {
    console.error("❌ Failed to create API key");
    console.error("Status:", error.response?.status);
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));
    throw new Error(`Failed to create API key: ${error.message}`);
  }
}

export async function getAccessToken(): Promise<string> {
  try {
    // Return cached token if still valid
    if (cachedToken && Date.now() < tokenExpiry) {
      console.log("✅ Using cached token");
      return cachedToken;
    }

    // Create API user and key if not cached
    if (!cachedApiUser || !cachedApiKey) {
      console.log("🔧 Creating new API credentials...");
      cachedApiUser = await createApiUser();
      console.log("⏳ Waiting 3 seconds for user activation...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      cachedApiKey = await createApiKey(cachedApiUser);
    }

    const auth = Buffer.from(`${cachedApiUser}:${cachedApiKey}`).toString("base64");

    console.log("🔑 Getting access token...");

    const response = await axios.post(
      `${BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        },
      }
    );

    if (!response.data?.access_token) {
      throw new Error("No access token in response");
    }

    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + 3600 * 1000; // Token valid for 1 hour

    console.log("✅ Access token received");
    return cachedToken;
  } catch (error: any) {
    console.error("❌ Failed to get access token");
    console.error("Status:", error.response?.status);
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));
    
    // Clear cache on error
    cachedApiUser = null;
    cachedApiKey = null;
    cachedToken = null;
    
    if (error.response?.status === 401) {
      throw new Error("MTN MoMo authentication failed. Please verify your subscription key.");
    }
    
    throw new Error(`Failed to get MTN access token: ${error.response?.data?.message || error.message}`);
  }
}

export async function requestToPay(
  amount: number,
  phoneNumber: string,
  orderId: string
): Promise<string> {
  try {
    const token = await getAccessToken();
    const referenceId = uuidv4();

    // Clean phone number (remove + and any spaces)
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    console.log("💰 Requesting payment:");
    console.log("  Amount:", amount, "RWF");
    console.log("  Phone:", cleanPhone);
    console.log("  Reference:", referenceId);

    await axios.post(
      `${BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: amount.toString(),
        currency: "RWF",
        externalId: orderId,
        payer: {
          partyIdType: "MSISDN",
          partyId: cleanPhone,
        },
        payerMessage: "Payment for jersey order",
        payeeNote: `Order ${orderId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Payment request sent successfully");
    return referenceId;
  } catch (error: any) {
    console.error("❌ Payment request failed:");
    console.error("Status:", error.response?.status);
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));
    throw new Error(error.response?.data?.message || "Failed to create payment request");
  }
}

export async function getTransactionStatus(referenceId: string) {
  try {
    const token = await getAccessToken();

    console.log("🔍 Checking transaction status:", referenceId);

    const response = await axios.get(
      `${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        },
      }
    );

    console.log("✅ Transaction status:", response.data.status);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to get status");
    console.error("Status:", error.response?.status);
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}