import { describe, it, expect } from "vitest";
import { TaggedParser, type Section } from "@/lib/tagged-parser";

function collect() {
  const speech: string[] = [];
  const sections: Array<{ section: Section; content: string }> = [];
  const parser = new TaggedParser({
    onSpeechText: (t) => speech.push(t),
    onSection: (section, content) => sections.push({ section, content }),
  });
  return { parser, speech, sections };
}

const FULL =
  '<speech>Hello class. Today we learn fractions.</speech>\n' +
  '<visual>{"visual_mode":"none"}</visual>\n' +
  '<state>{"current_segment":1}</state>';

describe("TaggedParser", () => {
  it("parses a complete response in one push", () => {
    const { parser, speech, sections } = collect();
    parser.push(FULL);
    parser.end();
    expect(speech.join("")).toBe("Hello class. Today we learn fractions.");
    expect(sections.map((s) => s.section)).toEqual(["speech", "visual", "state"]);
    expect(sections[1].content).toBe('{"visual_mode":"none"}');
  });

  it("handles tags split across chunk boundaries", () => {
    const { parser, speech, sections } = collect();
    for (const c of ["<spe", "ech>Hi the", "re.</spee", 'ch><visual>{"a"', ":1}</visual><sta", 'te>{"b":2}</state>']) {
      parser.push(c);
    }
    parser.end();
    expect(speech.join("")).toBe("Hi there.");
    expect(sections).toHaveLength(3);
    expect(sections[2].content).toBe('{"b":2}');
  });

  it("streams speech incrementally before the closing tag arrives", () => {
    const { parser, speech } = collect();
    parser.push("<speech>First sentence here. More words");
    expect(speech.join("").length).toBeGreaterThan(0);
    expect(speech.join("")).not.toContain("<");
  });

  it("flushes an unclosed section on end()", () => {
    const { parser, speech, sections } = collect();
    parser.push("<speech>Cut off mid-");
    parser.end();
    expect(speech.join("")).toBe("Cut off mid-");
    expect(sections).toEqual([{ section: "speech", content: "Cut off mid-" }]);
  });

  it("ignores stray text between sections", () => {
    const { parser, sections } = collect();
    parser.push("noise <speech>A.</speech> junk <visual>{}</visual>");
    parser.end();
    expect(sections.map((s) => s.section)).toEqual(["speech", "visual"]);
    expect(sections[0].content).toBe("A.");
  });
});
