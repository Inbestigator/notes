import PanContainer from "@/components/pan-container";
import ProjectManager from "@/components/project-manager";
import HUD from "@/components/hud";
import { Suspense } from "react";
import SettingsDialog from "@/components/settings-dialog";
import ItemList from "@/components/items";
import ClientOnly from "@/components/client-only";

export default function Home() {
  return (
    <Suspense>
      <ProjectManager />
      <ClientOnly>
        <PanContainer>
          <ItemList />
        </PanContainer>
        <HUD />
      </ClientOnly>
      <SettingsDialog />
    </Suspense>
  );
}
