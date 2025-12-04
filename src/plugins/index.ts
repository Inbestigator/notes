import excalidraw from "./excalidraw";
import header from "./header";
import linedPaper from "./lined-paper";
import math from "./math";
import pdf from "./pdf";
import still from "./still";
import textSticky from "./text-sticky";

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

export default [textSticky, linedPaper, still, header, math, excalidraw, pdf] as Plugin<unknown>[];
