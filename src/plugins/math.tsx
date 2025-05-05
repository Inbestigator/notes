"use client";

import type { BaseItem } from "@/components/items";
import type { Plugin } from ".";
import { CalculatorIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import Script from "next/script";
import Sheet from "@/components/primitives/paper";
import useDebouncedUpdate from "@/lib/hooks/useDebouncedUpdate";

interface Math extends BaseItem {
  calculator: unknown;
}

function Calculator({ id, initial }: { id: string; initial: unknown }) {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const updateItem = useDebouncedUpdate(id, {
    calculator: initial,
  })[1];

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
      calc.observeEvent("change", () =>
        updateItem({ calculator: calc.getState() }),
      );
    }
    loadCalc();
  }, [initial, updateItem]);

  return (
    <>
      <Script
        src="https://www.desmos.com/api/v1.11/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"
        crossOrigin="anonymous"
      />
      <div ref={calculatorRef} className="h-96 w-2xl" />
    </>
  );
}

export default {
  name: "math",
  displayName: "Calculator",
  dimensions: { width: 672, height: 384 },
  HudComponent: () => <CalculatorIcon className="size-5" />,
  RenderedComponent,
} as Plugin<Math>;

function RenderedComponent({ id, item }: { id: string; item: Math }) {
  return (
    <Sheet id={id}>
      <Calculator id={id} initial={item.calculator} />
    </Sheet>
  );
}
