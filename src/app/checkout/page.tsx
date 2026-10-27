import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Checkout",
  description: "Complete your Arivo Objects order securely with Razorpay.",
  path: "/checkout",
});

export default function CheckoutPage() {
  return <CheckoutForm />;
}
