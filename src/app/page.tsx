import { Suspense } from "react";
import HUD from "@/components/hud";
import ItemList from "@/components/items";
import Loading from "@/components/loading-project";
import PanContainer from "@/components/pan-container";
import ProjectManager from "@/components/project-manager";
import SettingsDialog from "@/components/settings-dialog";

export default function Home() {
  return (
    <>
      <Loading />
      <Suspense>
        <ProjectManager />
        <PanContainer>
          <ItemList />
        </PanContainer>
        <HUD />
        <SettingsDialog />
      </Suspense>
    </>
  );
}
