import { useEffect, useState, useCallback } from "react";
import type { GymSession, PTSession, CardioSession, BodyMetric, Goals } from "./types";

const KEYS = {
  gym: "ft.gymSessions",
  pt: "ft.ptSessions",
  cardio: "ft.cardioSessions",
  body: "ft.bodyMetrics",
  goals: "ft.goals",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("ft:storage", { detail: key }));
}

function useStored<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(() => read(key, fallback));

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === key) setState(read(key, fallback));
    };
    window.addEventListener("ft:storage", handler);
    return () => window.removeEventListener("ft:storage", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
        write(key, next);
        return next;
      });
    },
    [key],
  );

  return [state, update] as const;
}

export const useGymSessions = () => useStored<GymSession[]>(KEYS.gym, []);
export const usePTSessions = () => useStored<PTSession[]>(KEYS.pt, []);
export const useCardioSessions = () => useStored<CardioSession[]>(KEYS.cardio, []);
export const useBodyMetrics = () => useStored<BodyMetric[]>(KEYS.body, []);
export const useGoals = () =>
  useStored<Goals>(KEYS.goals, {
    weeklyGym: 4,
    weeklyPT: 1,
    weeklyCardio: 2,
    targetWeightKg: 80,
  });

export const uid = () =>
  (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2) + Date.now().toString(36);
