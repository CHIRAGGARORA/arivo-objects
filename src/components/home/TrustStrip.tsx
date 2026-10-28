import { Container } from "@/components/ui/Container";

const items = [
  { title: "Free shipping", text: "On every order across India", icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" },
  { title: "Dispatched in 48 hours", text: "Packed with care, sent fast", icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2" },
  { title: "Secure payments", text: "UPI, cards & netbanking via Razorpay", icon: "M6 10V8a6 6 0 1 1 12 0v2M5 10h14v10H5zM12 14v2" },
  { title: "Made for gifting", text: "Sets that are ready to give", icon: "M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-sand/70 bg-bone/50">
      <Container className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4 md:py-12">
        {items.map((it) => (
          <div key={it.title} className="flex flex-col items-center text-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-charcoal/70">
              <path d={it.icon} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <p className="mt-3 font-display text-lg leading-tight">{it.title}</p>
            <p className="mt-1 text-xs text-charcoal/60">{it.text}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
