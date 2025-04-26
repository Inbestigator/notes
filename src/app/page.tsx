"use client";

import PanContainer from "@/components/pan-container";
import { LinedPaper, Still } from "@/components/paper";
import { TextSticky } from "@/components/sticky";
import { useEffect, useState } from "react";

export interface BaseBoardItem {
  id: string;
  offset: { x: number; y: number };
  z: number;
}

export interface StickyNote extends BaseBoardItem {
  type: "sticky";
  content: string;
  width?: number;
}

export interface LinedPaper extends BaseBoardItem {
  type: "lined-paper";
  title: string;
  content: string;
}

export interface Still extends BaseBoardItem {
  type: "still";
  title: string;
  src: string;
}

export type BoardItem = StickyNote | LinedPaper | Still;

const id1 = crypto.randomUUID();
const id2 = crypto.randomUUID();
const id3 = crypto.randomUUID();
const id4 = crypto.randomUUID();

export default function Home() {
  const [notes, setNotes] = useState<Map<string, BoardItem>>(
    new Map([
      [
        id1,
        {
          id: id1,
          type: "sticky",
          content:
            "Josephine was so cute when she was a puppy!\n\nShe's already 16 now!",
          offset: { x: 1153, y: 413 },
          z: 1,
        },
      ],
      [
        id2,
        {
          id: id2,
          type: "sticky",
          content:
            "Golden Retriever puppies are some of the fuzziest, softest little creatures you'll ever meet. When they're young, their fur is extra fluffy, like a warm, golden cloud you can't help but cuddle. Every hug feels like wrapping yourself in pure happiness. Their fuzzy coats, paired with their playful energy and innocent eyes, make Golden Retriever puppies absolutely irresistible. It's no wonder they steal hearts from the moment you meet them.",
          offset: { x: 772, y: 661 },
          width: 512,
          z: 0,
        },
      ],
      [
        id3,
        {
          id: id3,
          type: "lined-paper",
          title: "Josephine is the Best!",
          content:
            "My dog, Josephine, is a Golden Retriever, a breed known for their kindness, intelligence, and loyalty. From the moment she came into my life, she brought a special kind of warmth that is hard to put into words. Golden Retrievers are famous for their gentle nature, and Josephine is no exception — she is always ready to offer a wagging tail, a loving nudge, or a playful bark to lift the spirits of anyone around her. Her golden coat and bright eyes reflect the sunshine she brings into every room she enters.\n\nDogs, and especially Golden Retrievers like Josephine, are incredibly emotional creatures. They can sense when we are sad, anxious, or joyful, and they respond in ways that feel almost human. Josephine has an amazing ability to comfort me without saying a word, just by sitting close or resting her head in my lap. Science shows that dogs can lower stress and help with emotional healing, but Josephine proves it every day just by being herself. Her quiet loyalty and big heart have helped me through more than she’ll ever know.\n\nBeyond emotional support, dogs are also incredibly helpful in everyday life. They encourage us to stay active, teach us responsibility, and remind us to find joy in the little things — like a game of fetch or a walk through the park. Josephine is more than just a pet; she’s a best friend, a teacher, and a constant source of unconditional love. She reminds me daily that no matter what challenges I face, there’s always happiness to be found with her by my side.",
          offset: {
            x: 122,
            y: 108,
          },
          z: 0,
        },
      ],
      [
        id4,
        {
          id: id4,
          type: "still",
          title: "Josephine, June 2009",
          src: "https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=0.752xw:1.00xh;0.175xw,0&resize=1200:*",
          offset: { x: 844, y: 42 },
          z: 0,
        },
      ],
    ]),
  );

  function updateItem(
    id: string,
    item:
      | Partial<BoardItem>
      | ((prev: Map<string, BoardItem>) => Partial<BoardItem>),
  ) {
    setNotes((prev) => {
      const newNotes = new Map(prev);
      if (typeof item === "function") {
        item = item(newNotes);
      }
      newNotes.set(id, {
        ...newNotes.get(id)!,
        ...item,
      } as BoardItem);
      return newNotes;
    });
  }

  function handleBringToFront(id: string, currentZ: number) {
    updateItem(id, (n) => {
      const highest = Math.max(...n.values().map((n) => n.z));
      return {
        z: highest > currentZ ? highest + 1 : currentZ,
      };
    });
  }

  function handleStickySetWidth(id: string, width: number) {
    updateItem(id, { width });
  }

  useEffect(() => {
    const handleItemUpdate = (e: Event) => {
      if (e instanceof CustomEvent) {
        if (!e.detail || !e.detail.id || !e.detail.partial) return;

        updateItem(e.detail.id, e.detail.partial);
      }
    };

    window.addEventListener("itemUpdate", handleItemUpdate);

    return () => {
      window.removeEventListener("itemUpdate", handleItemUpdate);
    };
  }, []);

  return (
    <PanContainer>
      {[...notes]
        .sort((a, b) => a[1].z - b[1].z)
        .map(([id, note]) => (
          <div key={id} onDoubleClick={() => handleBringToFront(id, note.z)}>
            {note.type === "sticky" ? (
              <TextSticky
                id={id}
                item={note}
                setWidth={(width) => handleStickySetWidth(id, width)}
              />
            ) : note.type === "lined-paper" ? (
              <LinedPaper id={id} item={note} />
            ) : note.type === "still" ? (
              <Still id={id} item={note} />
            ) : null}
          </div>
        ))}
    </PanContainer>
  );
}
