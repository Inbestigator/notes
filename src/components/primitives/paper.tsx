import type { ClassValue } from "clsx";
import { cn } from "@/lib/utils";
import ItemWrapper from "../item-wrapper";

export default function Sheet({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: ClassValue;
}) {
  return (
    <ItemWrapper
      id={id}
      tabClassName="bg-neutral-200"
      className={cn("min-h-96 bg-neutral-50 text-gray-800", className)}
    >
      {children}
    </ItemWrapper>
  );
}
