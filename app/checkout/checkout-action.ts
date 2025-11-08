"use server";

import { CartItem } from "@/store/cart-store";
import { getAccessToken, createOrder } from "@/lib/pesapal";

interface CheckoutOptions {
  paymentMethod?: "card" | "mobilemoney"; // default is card
}

export const checkoutAction = async (
  formData: FormData,
  options: CheckoutOptions = {}
): Promise<{ url?: string; error?: string }> => {
  try {
    console.log("🔵 Starting checkout process...");

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      throw new Error("Server configuration error: NEXT_PUBLIC_BASE_URL is not defined");
    }

    if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
      throw new Error("Payment gateway not configured: Pesapal credentials missing");
    }

    // Extract cart items
    const itemsJson = formData.get("items") as string;
    if (!itemsJson) throw new Error("No cart items provided");
    const items = JSON.parse(itemsJson) as CartItem[];

    if (items.length === 0) {
      throw new Error("Cart is empty");
    }

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    console.log("💰 Total amount:", total);

    // Determine payment method (fallback to card)
    let paymentMethod = options.paymentMethod || "card";
    const paymentMethodFromForm = formData.get("paymentMethod") as string;
    if (paymentMethodFromForm === "mobilemoney") paymentMethod = "mobilemoney";

    console.log("💳 Payment method:", paymentMethod);

    // Get access token from Pesapal
    console.log("🔑 Requesting access token...");
    const token = await getAccessToken();
    if (!token) throw new Error("Failed to get access token from Pesapal");
    console.log("✅ Access token received");

    // Prepare order data
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/success`;
    const order = {
      id: `ORDER_${Date.now()}`,
      currency: "RWF",
      amount: total,
      description: "Jersey order payment",
      callback_url: callbackUrl,
      billing_address: {
        email_address: "customer@example.com",
        first_name: "John",
        last_name: "Doe",
        phone_number: "+250700000000",
      },
      payment_method: paymentMethod,
    };

    console.log("📋 Creating order with data:", JSON.stringify(order, null, 2));

    // Create order in Pesapal
    const orderResponse = await createOrder(token, order);
    if (!orderResponse?.redirect_url) {
      throw new Error("Payment gateway did not provide a valid redirect URL");
    }

    console.log("✅ Redirect URL received:", orderResponse.redirect_url);

    // Return the URL for client-side redirect
    return { url: orderResponse.redirect_url };
  } catch (error: any) {
    console.error("❌ Checkout error:", error);
    return { error: error.message || "Checkout failed" };
  }
};
