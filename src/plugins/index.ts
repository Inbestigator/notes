import linedPaper from "./lined-paper";
import textSticky from "./text-sticky";
import still from "./still";
import header from "./header";
import math from "./math";
import excalidraw from "./excalidraw";
import pdf from "./pdf";

export interface Plugin<T> {
  name: string;
  displayName?: string;
  description?: string;
  isRequired?: boolean;
  numVariants?: number;
  /** Used for placing upon creation */
  dimensions?:
    | ((variant: number) => { width: number; height: number })
    | {
        width: number;
        height: number;
      };
  defaultProps?: ((variant: number) => Partial<T>) | Partial<T>;
  HudComponent?: ({ variant }: { variant: number }) => React.ReactNode;
  RenderedComponent: ({ id, item }: { id: string; item: T }) => React.ReactNode;
}

const plugins = [
  textSticky,
  linedPaper,
  still,
  header,
  math,
  excalidraw,
  pdf,
] as Plugin<unknown>[];

export default plugins;
