"use client";

import PanContainer from "@/components/pan-container";
import Sheet, { LinedPaper } from "@/components/paper";
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

const id1 = crypto.randomUUID();
const id2 = crypto.randomUUID();
const id3 = crypto.randomUUID();

export default function Home() {
  const [notes, setNotes] = useState<Map<string, StickyNote | LinedPaper>>(
    new Map([
      [
        id1,
        {
          id: id1,
          type: "sticky",
          title: "Note 1",
          content: "Content of note 1",
          offset: { x: 0, y: 0 },
          z: 0,
        },
      ],
      [
        id2,
        {
          id: id2,
          type: "sticky",
          title: "Note 2",
          content: "Content of note 2",
          offset: { x: 10, y: 10 },
          z: 1,
        },
      ],
      [
        id3,
        {
          id: id3,
          type: "lined-paper",
          title: "Paper 1",
          content: `Content of paper 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Maecenas luctus feugiat arcu id maximus. Pellentesque fermentum
eros ac dolor egestas interdum. Pellentesque eros odio,
tristique ac volutpat sit amet, commodo eu urna. Mauris ut diam
ornare, commodo mi vel, vulputate arcu. Lorem ipsum dolor sit
amet, consectetur adipiscing elit. Nulla felis metus, auctor
quis arcu non, malesuada elementum velit. Integer interdum metus
sit amet arcu molestie, eget bibendum nunc finibus. Etiam turpis
libero, placerat eu vehicula sit amet, mattis in mauris. Nullam
nec ullamcorper est. In et malesuada neque, at mattis ex. Fusce
rutrum in nisl a scelerisque. Etiam iaculis, tortor vitae
feugiat suscipit, est quam fermentum eros, vitae pretium felis
libero nec purus. Vivamus justo orci, lobortis quis ultrices et,
malesuada vel nisl.

Duis at lorem nec orci imperdiet porta pretium vel ligula.
Maecenas at urna eget lectus cursus elementum et rhoncus purus.
Ut cursus in sem eget varius. Etiam sed purus sagittis, gravida
urna non, hendrerit nulla. Sed ultricies dui lobortis nisi
aliquam, at efficitur mi tristique. Cras vitae metus eu libero
iaculis placerat. Sed nulla massa, tincidunt et suscipit eu,
finibus eu mauris. Donec eget lacus lobortis, scelerisque justo
nec, consectetur lorem. Suspendisse cursus dignissim laoreet.
Sed pellentesque facilisis nisi, rutrum pharetra libero
facilisis at. Proin ut pulvinar ante. Nulla at massa tincidunt,
gravida mauris tristique, sodales nibh. Nunc sit amet quam
imperdiet, auctor odio a, interdum orci.

Nunc iaculis velit at purus rutrum efficitur et id libero.
Quisque vitae lorem vitae sapien condimentum sagittis. Donec vel
orci a sapien iaculis condimentum. Curabitur dictum est at
hendrerit iaculis. Aliquam erat volutpat. Integer iaculis
laoreet pellentesque. Praesent vitae ipsum sapien. Morbi metus
augue, feugiat facilisis urna nec, pretium tempus massa. Integer
turpis risus, aliquet sit amet sollicitudin mollis, ornare vitae
ante. Praesent pretium rutrum nunc, in rutrum libero viverra et.
Vestibulum suscipit ligula lectus.`,
          offset: { x: 20, y: 20 },
          z: 2,
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
          <div key={id} onClick={() => handleBringToFront(id)}>
            {note.type === "sticky" ? (
              <TextSticky
                setOffset={(offset) => handleSetOffset(id, offset)}
                offset={note.offset}
                content={note.content}
                placeholder={note.title}
              />
            ) : (
              <LinedPaper
                setOffset={(offset) => handleSetOffset(id, offset)}
                offset={note.offset}
                title={note.title}
                content={note.content}
              />
            )}
          </div>
        ))}
    </PanContainer>
  );
}
