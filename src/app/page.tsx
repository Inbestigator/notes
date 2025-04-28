import PanContainer from "@/components/pan-container";
import ProjectProvider from "@/components/project-provider";
import HUD from "@/components/hud";
import Items from "@/components/items";
import { Suspense } from "react";

export default function Home() {
  return (
    <ProjectProvider>
      <PanContainer>
        <Suspense>
          <Items />
          <HUD />
        </Suspense>
      </PanContainer>
    </ProjectProvider>
  );
}
