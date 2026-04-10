"use client";

import React from 'react';
import { motion } from "framer-motion";

export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent list-none m-0 p-0"
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <li 
                key={`${index}-${i}`}
                aria-hidden={index === 1 ? "true" : "false"}
                className="p-6 rounded-xl border border-[#1c1c1c]/10 bg-white hover:shadow-md transition-shadow duration-300 cursor-default select-none w-full max-w-[320px] group" 
              >
                <blockquote className="m-0 p-0">
                  <p className="text-[#1c1c1c]/80 leading-relaxed text-sm font-medium m-0 transition-colors duration-300">
                    "{text}"
                  </p>
                  <footer className="flex items-center gap-3 mt-6">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={`Avatar of ${name}`}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-[#1c1c1c]/5 group-hover:ring-[#ffc629]/50 transition-all duration-300 ease-in-out"
                    />
                    <div className="flex flex-col">
                      <cite className="font-semibold text-sm not-italic tracking-tight leading-snug text-[#1c1c1c]">
                        {name}
                      </cite>
                      <span className="text-xs tracking-tight text-[#1c1c1c]/60 mt-0.5">
                        {role}
                      </span>
                    </div>
                  </footer>
                </blockquote>
              </li>
            ))}
          </React.Fragment>
        ))]}
      </motion.ul>
    </div>
  );
};
