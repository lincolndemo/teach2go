import fs from "fs";
import path from "path";
import type { ClientTopic, Persona, Topic } from "@/lib/types";

function readJson<T>(...segments: string[]): T {
  const file = path.join(process.cwd(), "content", ...segments);
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

export function loadTopic(name: string): Topic {
  return readJson<Topic>("topics", `${name}.json`);
}

export function loadPersona(name: string): Persona {
  return readJson<Persona>("personas", `${name}.json`);
}

export function toClientTopic(topic: Topic): ClientTopic {
  return {
    ...topic,
    segments: topic.segments.map((s) => ({
      ...s,
      content: { ...s.content, check_question: { q: s.content.check_question.q } },
    })),
  };
}
