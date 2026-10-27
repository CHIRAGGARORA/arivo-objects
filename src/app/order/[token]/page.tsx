import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { OrderStatus } from "@/components/checkout/OrderStatus";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="py-12 md:py-20">
      <Container className="max-w-2xl">
        <OrderStatus token={token} />
      </Container>
    </div>
  );
}
