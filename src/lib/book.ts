import { supabase } from "./supabase";

export type BookSource = { id: string; label: string; path: string; note: string };

export const bookSources: BookSource[] = [
  { id: "part-1", label: "Book pages 1-50", path: "part-1-50.pdf", note: "Front matter and early units" },
  { id: "part-2", label: "Book pages 51-100", path: "part-51-100.pdf", note: "Later units and answer material" },
  { id: "part-3", label: "Book pages 101-132", path: "part-101-132.pdf", note: "Audio scripts and remaining material" },
];

export async function getPrivateBookUrl(path: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.storage.from("book-source").createSignedUrl(path, 60 * 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
