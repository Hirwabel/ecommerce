"use server";

import { CartItem } from "@/store/cart-store";
import { redirect } from "next/navigation";
import { getAccessToken, createOrder } from "@/lib/pesapal";
//import { requestToPay } from "@/lib/momo";

export const checkoutAction = async (formData: FormData): Promise<void> => {
  try {
    console.log("🔵 Starting checkout process...");

    const itemsJson = formData.get("items") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    if (!itemsJson) throw new Error("No cart items provided");

    const items = JSON.parse(itemsJson) as CartItem[];
    const total = items.reduce(
      (acc: number, item: CartItem) => acc + item.price * item.quantity,
      0
    );

    console.log("💰 Total:", total);
    console.log("💳 Payment method:", paymentMethod);

    // MTN Mobile Money 
   /**  if (paymentMethod === "mtn") {
      if (!phoneNumber) {
        throw new Error("Phone number is required for MTN Mobile Money");
      }

      const amountInRwf = Math.round(total / 100);
      const orderId = `ORDER_${Date.now()}`;

      console.log("📱 Processing MTN MoMo payment...");
      const referenceId = await requestToPay(amountInRwf, phoneNumber, orderId);
      console.log("✅ MTN payment request created:", referenceId);

      redirect(`/payment-status?ref=${referenceId}&method=mtn`);
    }


    if (paymentMethod === "airtel") {
      throw new Error("Airtel Money is not yet implemented");
    }
**/
    // Card Payment (via Pesapal)
    if (paymentMethod === "card") {
      if (!process.env.NEXT_PUBLIC_BASE_URL) {
        throw new Error("Server configuration error");
      }

      if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
        throw new Error("Payment gateway not configured");
      }

      console.log("💳 Processing card payment via Pesapal...");

      const token = await getAccessToken();
      if (!token) throw new Error("Failed to get Pesapal access token");

      const order = {
        id: `ORDER_${Date.now()}`,
        currency: "RWF",
        amount: total,
        description: "Jersey order payment",
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        billing_address: {
          email_address: "customer@example.com",
          first_name: "John",
          last_name: "Doe",
          phone_number: "+250700000000",
        },
      };

      console.log("📋 Creating Pesapal order...");
      const orderResponse = await createOrder(token, order);

      if (!orderResponse?.redirect_url) {
        throw new Error("No payment URL received from Pesapal");
      }

      console.log("✅ Redirecting to Pesapal:", orderResponse.redirect_url);
      
      // This will throw NEXT_REDIRECT which is expected - don't catch it
      redirect(orderResponse.redirect_url);
    }

    throw new Error("Invalid payment method selected");

  } catch (error: any) {
    // If it's a NEXT_REDIRECT error, let it through - it's not an actual error
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw redirect errors without wrapping them
    }
    
    // Only log and wrap actual errors
    console.error("❌ Checkout error:", error);
    throw new Error(`Checkout failed: ${error.message}`);
  }
};