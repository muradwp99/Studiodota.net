"use client";

import { createContext, useContext } from "react";

export type DropTarget = { parentId: string | null; index: number };

export type EditorApi = {
  serviceOptions: string[];
  selectedId: string | null;
  select: (id: string) => void;
  edit: (blockId: string, path: (string | number)[], value: string) => void;
  move: (id: string, dir: -1 | 1) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  // drag
  dragActive: boolean;
  dropTarget: DropTarget | null;
  startDrag: (id: string) => void;
  endDrag: () => void;
  hover: (target: DropTarget) => void;
  drop: () => void;
};

export const EditorContext = createContext<EditorApi | null>(null);

export function useEditor(): EditorApi {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside <EditorContext.Provider>");
  return ctx;
}
