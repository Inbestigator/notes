import { useSetAtom } from "jotai";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { enabledPluginsAtom } from "../state";

export function useEnabledPlugins() {
  const searchParams = useSearchParams();
  const enabled = searchParams
    .keys()
    .filter((k) => k.startsWith("p:"))
    .map((p) => p.slice(2))
    .toArray();
  const setEnabledPlugins = useSetAtom(enabledPluginsAtom);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Causes infinite rerender
  useEffect(() => setEnabledPlugins((prev) => [...new Set(prev.concat(enabled))]), []);

  return Object.assign(enabled, { set: (f: (p: string[]) => string[]) => setEnabledPlugins(() => f(enabled)) });
}
