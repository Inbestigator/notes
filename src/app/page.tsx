"use client";

import PanContainer from "@/components/pan-container";
import { LinedPaper, Still } from "@/components/paper";
import { TextSticky } from "@/components/sticky";
import { useState } from "react";

export interface BoardItem {
  id: string;
  offset: { x: number; y: number };
  z: number;
}

export interface StickyNote extends BoardItem {
  type: "sticky";
  title: string;
  content: string;
}

export interface LinedPaper extends BoardItem {
  type: "lined-paper";
  title: string;
  content: string;
}

export interface Still extends BoardItem {
  type: "still";
  title: string;
  src: string;
}

const id1 = crypto.randomUUID();
const id2 = crypto.randomUUID();
const id3 = crypto.randomUUID();
const id4 = crypto.randomUUID();

export default function Home() {
  const [notes, setNotes] = useState<
    Map<string, StickyNote | LinedPaper | Still>
  >(
    new Map([
      [
        id1,
        {
          id: id1,
          type: "sticky",
          title: "Note 1",
          content:
            "Josephine was so cute when she was a puppy!\n\nShe's already 16 now!",
          offset: { x: 837, y: 574 },
          z: 0,
        },
      ],
      [
        id2,
        {
          id: id2,
          type: "sticky",
          title: "Note 2",
          content:
            "Golden Retriever puppies are some of the fuzziest, softest little creatures you'll ever meet. When they're young, their fur is extra fluffy, like a warm, golden cloud you can't help but cuddle. Every hug feels like wrapping yourself in pure happiness. Their fuzzy coats, paired with their playful energy and innocent eyes, make Golden Retriever puppies absolutely irresistible. It's no wonder they steal hearts from the moment you meet them.",
          offset: { x: 1150, y: 376 },
          z: 1,
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

  function handleSetOffset(id: string, offset: { x: number; y: number }) {
    setNotes((prev) => {
      const newNotes = new Map(prev);
      newNotes.set(id, {
        ...newNotes.get(id)!,
        offset,
      });
      return newNotes;
    });
  }

  function handleBringToFront(id: string) {
    setNotes((prev) => {
      const newNotes = new Map(prev);
      newNotes.set(id, {
        ...newNotes.get(id)!,
        z: Math.max(...newNotes.values().map((n) => n.z)) + 1,
      });
      return newNotes;
    });
  }

  return (
    <PanContainer>
      {[...notes]
        .sort((a, b) => a[1].z - b[1].z)
        .map(([id, note]) => (
          <div
            key={id}
            onMouseOver={() => console.log(note)}
            onClick={() => handleBringToFront(id)}
          >
            {note.type === "sticky" ? (
              <TextSticky
                setOffset={(offset) => handleSetOffset(id, offset)}
                offset={note.offset}
                content={note.content}
                placeholder={note.title}
              />
            ) : note.type === "lined-paper" ? (
              <LinedPaper
                setOffset={(offset) => handleSetOffset(id, offset)}
                offset={note.offset}
                title={note.title}
                content={note.content}
              />
            ) : note.type === "still" ? (
              <Still
                setOffset={(offset) => handleSetOffset(id, offset)}
                offset={note.offset}
                title={note.title}
                src={note.src}
              />
            ) : null}
          </div>
        ))}
    </PanContainer>
  );
}
