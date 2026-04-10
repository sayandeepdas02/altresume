"use client";

import React from "react";

type CardT = {
  image: string;
  name: string;
  handle: string;
  testimonial: string;
};

const DEFAULT_DATA: CardT[] = [
  {
    image:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
    name: "Briar Martin",
    handle: "@briarmartin",
    testimonial:
      "AltResume helped me tailor my resume in minutes. Landed 3 interviews in the first week.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
    name: "Avery Johnson",
    handle: "@averywrites",
    testimonial:
      "The ATS optimization is spot-on. My callback rate went from 5% to over 40%.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60",
    name: "Jordan Lee",
    handle: "@jordantalks",
    testimonial:
      "Clean, fast, and effective. This is exactly what job searching needed.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60",
    name: "Morgan Chen",
    handle: "@morganchen",
    testimonial:
      "I used to spend hours tweaking my resume. Now it takes seconds. Game changer.",
  },
];

const DEFAULT_DATA_ROW2: CardT[] = [
  {
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60",
    name: "Sarah Palmer",
    handle: "@sarahdesigns",
    testimonial:
      "As a career coach, I recommend AltResume to every single one of my clients.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60",
    name: "David Kim",
    handle: "@davidkim_dev",
    testimonial:
      "Switched from manually editing resumes to AltResume. Never looking back.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=60",
    name: "Emily Rodriguez",
    handle: "@emilyrodriguez",
    testimonial:
      "The keyword matching feature alone is worth it. My resumes actually get read now.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=60",
    name: "Alex Turner",
    handle: "@alexturner",
    testimonial:
      "Professional, minimal, and the AI suggestions are genuinely helpful. 10/10.",
  },
];

const VerifyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 48 48"
    className="inline-block"
  >
    <polygon
      fill="#ffc629"
      points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884"
    ></polygon>
    <polygon
      fill="#fff"
      points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926"
    ></polygon>
  </svg>
);

const Card = ({ card }: { card: CardT }) => (
  <div className="card-base mx-3 w-72 shrink-0 py-6 px-6">
    <div className="flex gap-4">
      <img
        className="size-11 rounded-full object-cover shadow-sm"
        src={card.image}
        alt={card.name}
      />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm text-[#1c1c1c]">{card.name}</p>
          <VerifyIcon />
        </div>
        <span className="text-xs text-gray-400">{card.handle}</span>
      </div>
    </div>
    <p className="text-sm pt-4 text-gray-600 leading-relaxed">
      {card.testimonial}
    </p>
  </div>
);

function MarqueeRow({
  data,
  reverse = false,
  speed = 30,
}: {
  data: CardT[];
  reverse?: boolean;
  speed?: number;
}) {
  const doubled = React.useMemo(() => [...data, ...data], [data]);
  return (
    <div className="relative w-full mx-auto max-w-6xl overflow-hidden isolation-isolate">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-24 md:w-40 z-10 bg-gradient-to-r from-[#f4efe9] to-transparent" />
      <div
        className={`flex transform-gpu min-w-[200%] ${
          reverse ? "pt-3 pb-6" : "pt-6 pb-3"
        }`}
        style={{
          animation: `marqueeScroll ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((c, i) => (
          <Card key={i} card={c} />
        ))}
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-24 md:w-40 z-10 bg-gradient-to-l from-[#f4efe9] to-transparent" />
    </div>
  );
}

export default function Marquee({
  row1 = DEFAULT_DATA,
  row2 = DEFAULT_DATA_ROW2,
}: {
  row1?: CardT[];
  row2?: CardT[];
}) {
  return (
    <>
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="flex flex-col gap-4">
        <MarqueeRow data={row1} reverse={false} speed={30} />
        <MarqueeRow data={row2} reverse={true} speed={30} />
      </div>
    </>
  );
}
