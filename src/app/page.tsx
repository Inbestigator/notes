import PanContainer from "@/components/pan-container";
import ProjectProvider from "@/components/project-provider";
import HUD from "@/components/hud";
import Items from "@/components/items";
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
      <ProjectProvider>
        <PanContainer>
          <Items />
          <HUD />
        </PanContainer>
      </ProjectProvider>
    </Suspense>
  );
}
