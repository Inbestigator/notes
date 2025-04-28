"use client";

import type { BaseItem } from "@/components/items";
import type { Plugin } from ".";
import { CalculatorIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { memo, useRef } from "react";
import Script from "next/script";
import Sheet from "@/components/primitives/paper";

interface MathItem extends BaseItem {
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

  function loadCalc() {
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

  return (
    <>
      <Script
        src="https://www.desmos.com/api/v1.11/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"
        crossOrigin="anonymous"
        onReady={loadCalc}
        onLoad={loadCalc}
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
  RenderedComponent,
} as Plugin<MathItem>;

function RenderedComponent({ id, item }: { id: string; item: MathItem }) {
  return (
    <Sheet id={id}>
      <Calculator id={id} initial={item.calculator} />
    </Sheet>
  );
}
