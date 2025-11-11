"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const referenceId = searchParams.get("ref");
  const clearCart = useCartStore((state) => state.clearCart);

  const [status, setStatus] = useState<"checking" | "success" | "failed" | "pending">("checking");
  const [message, setMessage] = useState("Checking payment status...");
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 40; // Check for up to 2 minutes (40 × 3 seconds)

  useEffect(() => {
    if (!referenceId) {
      setStatus("failed");
      setMessage("Invalid payment reference");
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/momo/status?ref=${referenceId}`);
        const data = await response.json();

        console.log("Payment status:", data);

        if (data.status === "SUCCESSFUL") {
          setStatus("success");
          setMessage("Payment successful! Thank you for your order.");
          clearCart();
        } else if (data.status === "FAILED") {
          setStatus("failed");
          setMessage("Payment failed. Please try again.");
        } else {
          // Still pending
          setStatus("pending");
          setMessage("Waiting for payment approval on your phone...");
          
          setAttempts((prev) => {
            const newAttempts = prev + 1;
            if (newAttempts < maxAttempts) {
              setTimeout(checkStatus, 3000);
            } else {
              setStatus("failed");
              setMessage("Payment timeout. Please try again.");
            }
            return newAttempts;
          });
        }
      } catch (error) {
        console.error("Error checking status:", error);
        setStatus("failed");
        setMessage("Error checking payment status. Please contact support.");
      }
    };

    checkStatus();
  }, [referenceId, clearCart]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "checking" || status === "pending" ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-center text-gray-600">{message}</p>
              <div className="bg-blue-50 p-4 rounded-lg w-full">
                <p className="text-sm text-center text-blue-700 font-medium">
                  📱 Check your phone for the payment prompt
                </p>
                <p className="text-xs text-center text-blue-600 mt-2">
                  Enter your MTN Mobile Money PIN to complete payment
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Checking... ({attempts}/{maxAttempts})
              </p>
            </div>
          ) : status === "success" ? (
            <div className="text-center space-y-4">
              <div className="text-6xl">✅</div>
              <p className="text-green-600 font-semibold text-lg">{message}</p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">
                  Your order has been confirmed and is being processed.
                </p>
              </div>
              <Button onClick={() => router.push("/")} className="w-full">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-6xl">❌</div>
              <p className="text-red-600 font-semibold text-lg">{message}</p>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-700">
                  Please ensure you have sufficient balance and try again.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => router.push("/checkout")} className="w-full">
                  Try Again
                </Button>
                <Button 
                  onClick={() => router.push("/")} 
                  variant="outline" 
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}

          {referenceId && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
              <p className="font-semibold text-gray-700">Reference ID:</p>
              <p className="text-gray-600 break-all">{referenceId}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}