import type { Unit } from "./types";

export const KG_TO_LBS = 2.20462262;

// All weights are STORED in kg. Convert at the UI boundary.
export const toDisplay = (kg: number | undefined | null, unit: Unit): number | undefined => {
  if (kg == null || isNaN(kg)) return undefined;
  return unit === "kg" ? kg : kg * KG_TO_LBS;
};

export const fromInput = (val: number, unit: Unit): number =>
  unit === "kg" ? val : val / KG_TO_LBS;

export const formatWeight = (kg: number | undefined | null, unit: Unit, decimals = 1) => {
  const v = toDisplay(kg, unit);
  if (v == null) return "—";
  return `${v.toFixed(decimals).replace(/\.0$/, "")} ${unit}`;
};

export const distanceLabel = (unit: Unit) => (unit === "kg" ? "km" : "mi");
export const KM_TO_MI = 0.621371;
export const distanceToDisplay = (km: number | undefined, unit: Unit) =>
  km == null ? undefined : unit === "kg" ? km : km * KM_TO_MI;
export const distanceFromInput = (v: number, unit: Unit) =>
  unit === "kg" ? v : v / KM_TO_MI;
