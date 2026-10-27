import { CartPageContent } from "@/components/cart/CartPageContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Cart",
  description: "Review the items in your Arivo Objects cart.",
  path: "/cart",
});

export default function CartPage() {
  return <CartPageContent />;
}
