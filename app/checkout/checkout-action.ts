"use server";

import { CartItem } from "@/store/cart-store";
import { redirect } from "next/navigation";
import { requestToPay } from "@/lib/momo";

export const checkoutAction = async (formData: FormData): Promise<void> => {
  try {
    console.log("🔵 Starting checkout process...");

    const itemsJson = formData.get("items") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    const items = JSON.parse(itemsJson) as CartItem[];
    const total = items.reduce(
      (acc: number, item: CartItem) => acc + item.price * item.quantity,
      0
    );

    console.log("💰 Total:", total);
    console.log("💳 Payment method:", paymentMethod);
    console.log("📱 Phone:", phoneNumber);

    // Handle MTN Mobile Money
    if (paymentMethod === "mtn") {
      if (!phoneNumber) {
        throw new Error("Phone number is required for MTN Mobile Money");
      }

      // Convert cents to RWF
      const amountInRwf = Math.round(total / 100);
      const orderId = `ORDER_${Date.now()}`;

      console.log("💰 Amount in RWF:", amountInRwf);
      console.log("📝 Order ID:", orderId);

      // Request payment through MTN MoMo
      const referenceId = await requestToPay(amountInRwf, phoneNumber, orderId);

      console.log("✅ Payment request created:", referenceId);

      // Redirect to payment status page
      redirect(`/payment-status?ref=${referenceId}`);
    }

    // Handle Airtel Money (placeholder)
    if (paymentMethod === "airtel") {
      // TODO: Implement Airtel Money integration
      throw new Error("Airtel Money payment is not yet implemented");
    }

    // Handle Card Payment (placeholder)
    if (paymentMethod === "card") {
      // TODO: Implement card payment integration
      throw new Error("Card payment is not yet implemented");
    }

    throw new Error("Invalid payment method");

  } catch (error: any) {
    console.error("❌ Checkout error:", error);
    throw new Error(`Checkout failed: ${error.message}`);
  }
};