"use client";

import { createContext, useContext } from "react";

export type EditorApi = {
  serviceOptions: string[];
  selectedId: string | null;
  select: (id: string) => void;
  edit: (blockId: string, path: (string | number)[], value: string) => void;
  move: (id: string, dir: -1 | 1) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
};

export const EditorContext = createContext<EditorApi | null>(null);

export function useEditor(): EditorApi {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside <EditorContext.Provider>");
  return ctx;
}
