import { ContactForm } from "@/components/contact/ContactForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Get in touch with Arivo Objects about an order, a product, or anything else.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactForm />;
}
