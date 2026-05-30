import { PROVINCES } from "../constants/provinces.js";

const provinces = [...PROVINCES].sort((left, right) => left.name.localeCompare(right.name, "vi"));

export function useProvinces() {
  return { provinces, isLoading: false };
}
