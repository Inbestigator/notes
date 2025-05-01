import linedPaper from "./lined-paper";
import textSticky from "./text-sticky";
import still from "./still";
import header from "./header";
import math from "./math";
import excalidraw from "./excalidraw";

export interface Plugin<T> {
  name: string;
  displayName?: string;
  isRequired?: boolean;
  numVariants?: number;
  dimensions?:
    | ((variant: number) => { width: number; height: number })
    | {
        width: number;
        height: number;
      };
  defaultProps?: ((variant: number) => Partial<T>) | Partial<T>;
  HudComponent?: ({ variant }: { variant: number }) => React.ReactElement;
  RenderedComponent: ({
    id,
    item,
  }: {
    id: string;
    item: T;
  }) => React.ReactElement;
}

const plugins = [textSticky, linedPaper, still, header, math, excalidraw];

export default plugins;
