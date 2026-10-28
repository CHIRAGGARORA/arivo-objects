const messages = [
  "Free shipping across India",
  "Dispatched within 48 hours",
  "Code FIRST5 — 5% off your first order",
  "Sandalwood soy wax candles",
  "Hand-poured marble trays",
];

export function AnnouncementBar() {
  // Each half repeats the messages twice so it is always wider than the
  // screen; the track slides by exactly one half, so the loop is seamless.
  const half = [...messages, ...messages];
  return (
    <div className="overflow-hidden bg-charcoal py-2.5 text-ivory">
      <p className="sr-only">{messages.join(". ")}.</p>
      <div className="marquee-track flex w-max" aria-hidden="true">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {half.map((m, i) => (
              <li key={i} className="flex items-center whitespace-nowrap text-[11px] uppercase tracking-luxe">
                <span className="px-8">{m}</span>
                <span className="text-ochre">✦</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
