import linedPaper from "./lined-paper";
import textSticky from "./text-sticky";
import still from "./still";
import header from "./header";
import math from "./math";

export interface Plugin<T> {
  name: string;
  displayName?: string;
  isRequired?: boolean;
  numVariants?: number;
  dimensions?: { width: number; height: number };
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

const plugins = [textSticky, linedPaper, still, header, math];

export default plugins;
