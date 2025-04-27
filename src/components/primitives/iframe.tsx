import ItemWrapper from "../item-wrapper";
import { ClassValue } from "clsx";

export default function IFrame({
  id,
  className,
  props,
}: {
  id: string;
  className?: ClassValue;
  props: React.DetailedHTMLProps<
    React.IframeHTMLAttributes<HTMLIFrameElement>,
    HTMLIFrameElement
  >;
}) {
  return (
    <ItemWrapper
      id={id}
      tabClassName="bg-neutral-200"
      className={className as string}
    >
      <iframe {...props} />
    </ItemWrapper>
  );
}
