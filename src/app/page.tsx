import PanContainer from "@/components/pan-container";
import HUD from "@/components/hud";
import Items from "@/components/items";

export default async function Home() {
  return (
    <PanContainer>
      <Items>
        <HUD />
      </Items>
    </PanContainer>
  );
}
