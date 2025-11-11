"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkoutAction } from "@/app/checkout/checkout-action";

export default function CheckoutPage() {
  const { items, addItem, removeItem } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel" | "card">("mtn");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (total === 0 || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty.</h1>
        <Button onClick={() => (window.location.href = "/products")}>Continue Shopping</Button>
      </div>
    );
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Phone is 9-digit string without +250
    if (paymentMethod === "mtn") {
      return /^(78|79)\d{7}$/.test(phone);
    }
    if (paymentMethod === "airtel") {
      return /^(72|73)\d{7}$/.test(phone);
    }
    return true; // Card does not require validation
  };

  const getPhonePrefix = () => {
    if (paymentMethod === "mtn") return "78 or 79";
    if (paymentMethod === "airtel") return "72 or 73";
    return "";
  };

  const handleCheckout = async () => {
    setError("");

    if (paymentMethod === "mtn" || paymentMethod === "airtel") {
      if (!phoneNumber) {
        setError("Please enter your mobile money phone number");
        return;
      }
      if (!validatePhoneNumber(phoneNumber)) {
        setError(`Invalid ${paymentMethod.toUpperCase()} number. Use ${getPhonePrefix()}xxxxxxx`);
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("items", JSON.stringify(items));
      formData.append("paymentMethod", paymentMethod);

      if (paymentMethod === "mtn" || paymentMethod === "airtel") {
        const cleanPhone = phoneNumber.replace(/\D/g, "");
        const formattedPhone = cleanPhone.startsWith("250") ? `+${cleanPhone}` : `+250${cleanPhone}`;
        formData.append("phoneNumber", formattedPhone);
      }

      await checkoutAction(formData);
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Checkout failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>

      {/* Order Summary */}
      <Card className="max-w-md mx-auto mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 border-b pb-2">
                <div className="flex justify-between">
                  <span className="font-medium">{item.name}</span>
                  <span className="font-semibold">{((item.price * item.quantity) / 100).toFixed(0)} RWF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => removeItem(item.id)} disabled={loading}>–</Button>
                  <span className="text-lg font-semibold">{item.quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => addItem({ ...item, quantity: 1 })} disabled={loading}>+</Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t pt-2 text-xl font-bold text-center">Total: {(total / 100).toFixed(0)} RWF</div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card className="max-w-md mx-auto mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Please select your preferred payment option</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["mtn", "airtel", "card"].map((method) => (
            <div
              key={method}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === method
                  ? method === "mtn" ? "border-yellow-500 bg-yellow-50"
                  : method === "airtel" ? "border-red-500 bg-red-50"
                  : "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                setPaymentMethod(method as "mtn" | "airtel" | "card");
                setPhoneNumber("");
                setError("");
              }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method as "mtn" | "airtel" | "card")}
                  className={`w-5 h-5 ${
                    method === "mtn" ? "accent-yellow-500"
                    : method === "airtel" ? "accent-red-500"
                    : "accent-blue-500"
                  }`}
                />
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{method === "mtn" ? "📱" : method === "airtel" ? "📱" : "💳"}</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg">
                      {method === "card" ? "Visa / Mastercard" : method.toUpperCase() + " Mobile Money"}
                    </span>
                    {method === "card" && <span className="text-xs text-gray-500">Credit or Debit Card</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Mobile Money Input */}
      {(paymentMethod === "mtn" || paymentMethod === "airtel") && (
        <Card className="max-w-md mx-auto mb-6">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Pay "{(total / 100).toFixed(0)} RWF" with {paymentMethod.toUpperCase()} Mobile Money
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                1. Provide your {paymentMethod.toUpperCase()} mobile number
              </Label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-md px-3 font-semibold text-gray-700">
                  +250
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={paymentMethod === "mtn" ? "78xxxxxxx" : "72xxxxxxx"}
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setPhoneNumber(value.slice(0, 9));
                    setError("");
                  }}
                  className="flex-1 text-base"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {paymentMethod === "mtn" ? "MTN numbers start with 78 or 79" : "Airtel numbers start with 72 or 73"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Info */}
      {paymentMethod === "card" && (
        <Card className="max-w-md mx-auto mb-6">
          <CardContent className="pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                You will be redirected to a secure payment page to enter your card details (Visa, Mastercard, or AmEx).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-md mx-auto mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="max-w-md mx-auto">
        <Button
          onClick={handleCheckout}
          className="w-full text-lg py-6 font-semibold"
          disabled={loading}
        >
          {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span> Processing Payment...</span>
          : `Proceed - ${(total / 100).toFixed(0)} RWF`}
        </Button>
      </div>
    </div>
  );
}
