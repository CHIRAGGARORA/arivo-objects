"use client";

import { useState, ReactNode } from "react";

interface AccordionSection {
  title: string;
  content: ReactNode;
}

export function ProductAccordion({ sections }: { sections: AccordionSection[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-sand/60 border-y border-sand/60">
      {sections.map((section, i) => {
        const open = openIndex === i;
        return (
          <div key={section.title}>
            <button
              type="button"
              className="flex w-full items-center justify-between py-4 text-left"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : i)}
            >
              <span className="text-sm">{section.title}</span>
              <span aria-hidden="true" className="text-charcoal/60">
                {open ? "–" : "+"}
              </span>
            </button>
            {open && (
              <div className="pb-5 text-sm leading-relaxed text-charcoal/75">
                {section.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
