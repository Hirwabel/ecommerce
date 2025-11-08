"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { checkoutAction } from "@/app/checkout/checkout-action";

export default function CheckoutPage() {
  const { items, addItem, removeItem } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobilemoney">("card");

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (total === 0 || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty.</h1>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("items", JSON.stringify(items));
      formData.append("paymentMethod", paymentMethod); // Pass payment method

      const response = await checkoutAction(formData);

      if (response?.url) {
        window.location.href = response.url; // Pesapal handles the payment method
      } else {
        console.error("No redirect URL received");
        alert("Payment gateway did not return a redirect URL.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert("Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>

      <Card className="max-w-md mx-auto mb-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 border-b pb-2">
                <div className="flex justify-between">
                  <span className="font-medium">{item.name}</span>
                  <span className="font-semibold">
                    ${(item.price * item.quantity / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => removeItem(item.id)}>–</Button>
                  <span className="text-lg font-semibold">{item.quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => addItem({ ...item, quantity: 1 })}>+</Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t pt-2 text-lg font-semibold">
            Total: ${(total / 100).toFixed(2)}
          </div>
        </CardContent>
      </Card>

      {/* Payment method selection */}
      <Card className="max-w-md mx-auto mb-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 justify-center">
          <Button
            variant={paymentMethod === "card" ? "default" : "outline"}
            onClick={() => setPaymentMethod("card")}
          >
            Card
          </Button>
          <Button
            variant={paymentMethod === "mobilemoney" ? "default" : "outline"}
            onClick={() => setPaymentMethod("mobilemoney")}
          >
            MTN Mobile Money
          </Button>
        </CardContent>
      </Card>

      {/* Submit button */}
      <form onSubmit={handleCheckout} className="max-w-md mx-auto">
        <Button type="submit" variant="default" className="w-full" disabled={loading}>
          {loading ? "Processing..." : `Pay with ${paymentMethod === "card" ? "Card" : "MTN Mobile Money"}`}
        </Button>
      </form>
    </div>
  );
}
