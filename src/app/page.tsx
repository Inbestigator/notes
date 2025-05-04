import PanContainer from "@/components/pan-container";
import ProjectManager from "@/components/project-manager";
import HUD from "@/components/hud";
import { Suspense } from "react";
import SettingsDialog from "@/components/settings-dialog";
import ItemList from "@/components/items";
import Loading from "@/components/loading-project";

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
