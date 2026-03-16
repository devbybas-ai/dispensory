import { Truck, FlaskConical, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface InfoCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

const INFO_CARDS: InfoCard[] = [
  {
    icon: Truck,
    title: "Same-Day Delivery",
    description:
      "Order by 8 PM for same-day delivery throughout our service area in Southern California. Real-time tracking included.",
  },
  {
    icon: FlaskConical,
    title: "Licensed & Lab-Tested",
    description:
      "Every product is DCC-licensed and comes with a Certificate of Analysis. We never sell untested cannabis.",
  },
  {
    icon: Users,
    title: "Expert Guidance",
    description:
      "Our knowledgeable staff can help you find exactly what you need — whether you're new or a seasoned consumer.",
  },
];

export function InfoSection() {
  return (
    <section
      aria-labelledby="info-heading"
      className="border-t border-neutral-200 bg-neutral-50 py-16 px-4"
    >
      <div className="mx-auto max-w-5xl">
        <h2 id="info-heading" className="sr-only">
          Why shop with us
        </h2>

        <ul
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
          role="list"
          aria-label="Store benefits"
        >
          {INFO_CARDS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"
              >
                <Icon className="h-7 w-7 text-emerald-700" strokeWidth={1.75} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
