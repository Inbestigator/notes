import PanContainer from "@/components/pan-container";
import ProjectManager from "@/components/project-manager";
import HUD from "@/components/hud";
import ItemList from "@/components/items";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div
          className="absolute inset-0 bg-[size:32px] bg-clip-border"
          style={{
            backgroundImage: "url('/dots.png')",
            willChange: "background-position",
          }}
        />
      }
    >
      <ProjectManager />
      <PanContainer>
        <ItemList />
      </PanContainer>
      <HUD />
    </Suspense>
  );
}
