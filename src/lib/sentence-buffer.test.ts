import { describe, it, expect } from "vitest";
import { SentenceBuffer } from "@/lib/sentence-buffer";

describe("SentenceBuffer", () => {
  it("emits complete sentences and holds the remainder", () => {
    const b = new SentenceBuffer();
    expect(b.push("Hello class. Today we ")).toEqual(["Hello class."]);
    expect(b.push("learn fractions! Ready")).toEqual(["Today we learn fractions!"]);
    expect(b.flush()).toEqual(["Ready"]);
  });

  it("handles question marks and multi-sentence chunks", () => {
    const b = new SentenceBuffer();
    expect(b.push("What is a fraction? It is part of a whole. And")).toEqual([
      "What is a fraction?",
      "It is part of a whole.",
    ]);
  });

  it("flush on empty buffer returns nothing", () => {
    const b = new SentenceBuffer();
    expect(b.flush()).toEqual([]);
  });
});
