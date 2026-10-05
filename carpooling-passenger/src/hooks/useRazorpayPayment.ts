import { useState } from "react";
import toast from "react-hot-toast";
import {
  createPaymentOrder,
  verifyPayment,
} from "@/services/passengerService";
import type { PaymentOrderResponse } from "@/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const SDK_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let sdkPromise: Promise<void> | null = null;

const loadRazorpaySdk = async (): Promise<void> => {
  if (window.Razorpay) return;

  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SDK_SRC}"]`
      );

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Failed to load Razorpay SDK")),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.src = SDK_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.body.appendChild(script);
    }).finally(() => {
      sdkPromise = null;
    });
  }

  return sdkPromise;
};

interface UseRazorpayPaymentOptions {
  onVerified?: (order: PaymentOrderResponse) => void | Promise<void>;
  onDismiss?: () => void;
  onError?: (message: string) => void;
}

export function useRazorpayPayment(options: UseRazorpayPaymentOptions = {}) {
  const [isLoadingSdk, setIsLoadingSdk] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const payNow = async (bookingId: string) => {
    setIsProcessing(true);
    try {
      setIsLoadingSdk(true);
      await loadRazorpaySdk();
      setIsLoadingSdk(false);

      const order = await createPaymentOrder(bookingId);
      const RazorpayCtor = window.Razorpay;

      if (!RazorpayCtor) {
        throw new Error("Razorpay checkout is unavailable.");
      }

      const instance = new RazorpayCtor({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "RideShare",
        description: "Advance booking payment",
        handler: async (response: {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        }) => {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id || order.orderId,
              razorpayPaymentId: response.razorpay_payment_id || "",
              razorpaySignature: response.razorpay_signature || "",
              bookingId,
            });
            await options.onVerified?.(order);
            toast.success("Payment verified successfully.");
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Payment was captured, but verification failed.";
            toast.error(
              "Payment callback received, but verification needs a refresh."
            );
            options.onError?.(message);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error("Payment window closed before completion.");
            options.onDismiss?.();
          },
        },
        theme: {
          color: "#1d4ed8",
        },
      });

      instance.open();
    } catch (error) {
      setIsLoadingSdk(false);
      setIsProcessing(false);
      const message =
        error instanceof Error ? error.message : "Failed to start payment.";
      toast.error(message);
      options.onError?.(message);
    }
  };

  return {
    payNow,
    isLoadingSdk,
    isProcessing,
  };
}
