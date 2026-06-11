import crypto from "crypto";
import type { LessonState, Msg, Persona, Topic } from "@/lib/types";
import { initialLessonState } from "@/lib/lesson-state";

export interface Session {
  id: string;
  topic: Topic;
  persona: Persona;
  lessonState: LessonState;
  history: Msg[];
  createdAt: number;
}

// Stored on globalThis so Next dev-server module reloads don't wipe live sessions
const g = globalThis as typeof globalThis & { __teach2goSessions?: Map<string, Session> };
const sessions = (g.__teach2goSessions ??= new Map<string, Session>());

export function createSession(topic: Topic, persona: Persona): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    topic,
    persona,
    lessonState: initialLessonState(),
    history: [],
    createdAt: Date.now(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}
