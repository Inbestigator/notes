import PanContainer from "@/components/pan-container";
import HUD from "@/components/hud";
import Items from "@/components/items";
import { Suspense } from "react";

export default function Home() {
  return (
    <PanContainer>
      <Suspense>
        <Items>
          <HUD />
        </Items>
      </Suspense>
    </PanContainer>
  );
}
