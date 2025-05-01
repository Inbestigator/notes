"use client";

import type { BaseItem } from "@/components/items";
import type { Plugin } from ".";
import { CalculatorIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { memo, useEffect, useRef } from "react";
import Script from "next/script";
import Sheet from "@/components/primitives/paper";

interface Math extends BaseItem {
  type: "math";
  calculator: unknown;
}

const Calculator = memo(function Calculator({
  id,
  initial,
}: {
  id: string;
  initial: unknown;
}) {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const debouncedSave = useDebouncedCallback((calculator) => {
    window.dispatchEvent(
      new CustomEvent("itemUpdate", {
        detail: { id, partial: { calculator } },
      }),
    );
  }, 150);

  useEffect(() => {
    function loadCalc() {
      if (!calculatorRef.current || typeof Desmos === "undefined") {
        setTimeout(loadCalc, 150);
        return;
      }
      const calc = Desmos.GraphingCalculator(calculatorRef.current!, {
        keypad: false,
        border: false,
      });
      if (initial) {
        calc.setState(initial);
      } else {
        calc.setBlank();
      }
      calc.observeEvent("change", () => debouncedSave(calc.getState()));
    }
    loadCalc();
  }, [initial, debouncedSave]);

  return (
    <>
      <Script
        src="https://www.desmos.com/api/v1.11/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"
        crossOrigin="anonymous"
      />
      <div ref={calculatorRef} className="h-96 w-2xl" />
    </>
  );
});

export default {
  name: "math",
  displayName: "Calculator",
  dimensions: { width: 672, height: 384 },
  HudComponent: () => <CalculatorIcon className="size-5" />,
  RenderedComponent: memo(RenderedComponent),
} as Plugin<Math>;

function RenderedComponent({ id, item }: { id: string; item: Math }) {
  return (
    <Sheet id={id}>
      <Calculator id={id} initial={item.calculator} />
    </Sheet>
  );
}
