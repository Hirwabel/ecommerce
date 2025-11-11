import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const BASE_URL = "https://sandbox.momodeveloper.mtn.com";
const SUBSCRIPTION_KEY = process.env.MTN_MOMO_SUBSCRIPTION_KEY;

async function testConnection() {
  console.log("🧪 Testing MTN MoMo Connection...\n");

  // Check 1: Verify subscription key exists
  console.log("1️⃣ Checking subscription key...");
  if (!SUBSCRIPTION_KEY) {
    console.error("❌ SUBSCRIPTION_KEY not found in .env file");
    return;
  }
  console.log("✅ Subscription key found:", SUBSCRIPTION_KEY.substring(0, 10) + "...");

  try {
    // Check 2: Test API connectivity
    console.log("\n2️⃣ Testing API connectivity...");
    const userId = uuidv4();
    
    const response = await axios.post(
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

    console.log("✅ API User creation successful!");
    console.log("Status:", response.status);

    // Check 3: Create API Key
    console.log("\n3️⃣ Creating API Key...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const keyResponse = await axios.post(
      `${BASE_URL}/v1_0/apiuser/${userId}/apikey`,
      {},
      {
        headers: {
          "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        },
      }
    );

    console.log("✅ API Key created:", keyResponse.data.apiKey);

    // Check 4: Get Access Token
    console.log("\n4️⃣ Getting access token...");
    const auth = Buffer.from(`${userId}:${keyResponse.data.apiKey}`).toString("base64");

    const tokenResponse = await axios.post(
      `${BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        },
      }
    );

    console.log("✅ Access token received!");
    console.log("Token:", tokenResponse.data.access_token.substring(0, 20) + "...");

    console.log("\n🎉 All tests passed! Your MTN MoMo integration is ready!");

  } catch (error: any) {
    console.error("\n❌ Test failed!");
    console.error("\nError Details:");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));
    console.error("Message:", error.message);

    // Common error explanations
    if (error.response?.status === 401) {
      console.error("\n💡 This usually means:");
      console.error("   - Your subscription key is invalid");
      console.error("   - You're not subscribed to Collections product");
      console.error("   - Your subscription has expired");
    } else if (error.response?.status === 404) {
      console.error("\n💡 This usually means:");
      console.error("   - The API endpoint is incorrect");
      console.error("   - You're using production URL with sandbox key (or vice versa)");
    }
  }
}

testConnection();