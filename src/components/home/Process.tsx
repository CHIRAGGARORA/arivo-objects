import { Container } from "@/components/ui/Container";

const steps = [
  { name: "Cast", description: "Pigmented Jesmonite is poured by hand into a mould." },
  { name: "Cure", description: "Each piece rests until it can safely hold its form." },
  { name: "Sand", description: "Edges and surfaces are refined by hand." },
  { name: "Finish", description: "A final check before a piece is ready to send." },
];

export function Process() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <h2 className="font-display text-2xl md:text-3xl">How an object is made</h2>
        <ol className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.name} className="border-t border-charcoal pt-4">
              <span className="text-xs text-charcoal/60">{`0${i + 1}`}</span>
              <p className="mt-2 font-display text-lg">{step.name}</p>
              <p className="mt-2 text-sm text-charcoal/70">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
