import { extractText as extractPdfText, getDocumentProxy } from "unpdf";

export async function extractText(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { text } = await extractPdfText(pdf, { mergePages: true });
    return text;
  }
  return file.text();
}
