"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

/** Large statement whose words light up one by one as the reader scrolls. */
export function TaglineReveal({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.45"],
  });

  const words = lines.flatMap((line, li) =>
    line.split(" ").map((w, wi) => ({ w, key: `${li}-${wi}`, line: li })),
  );

  return (
    <section aria-label={lines.join(" ")} className="bg-night py-24 md:py-24">
      <div ref={ref} className="mx-auto max-w-6xl px-4 sm:px-6">
        <p aria-hidden className="heading-3 sm:heading-2 lg:heading-1 max-w-[880px] text-white">
          {lines.map((_, li) => (
            <span key={li} className="block">
              {words
                .map((x, idx) => ({ ...x, idx }))
                .filter((x) => x.line === li)
                .map(({ w, key, idx }) => (
                  <Word
                    key={key}
                    progress={scrollYProgress}
                    range={[idx / words.length, (idx + 1) / words.length]}
                    still={!!reduce}
                  >
                    {w}
                  </Word>
                ))}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

function Word({
  children,
  progress,
  range,
  still,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  still: boolean;
}) {
  const opacity = useTransform(progress, range, [0.28, 1], {
    ease: (t) => 1 - Math.pow(1 - t, 3),
  });
  return (
    <motion.span style={{ opacity: still ? 1 : opacity }} className="inline-block pr-[0.25em]">
      {children}
    </motion.span>
  );
}
