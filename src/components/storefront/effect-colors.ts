export const EFFECT_COLORS = {
  RELAXATION: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", hover: "hover:bg-emerald-100 hover:shadow-emerald-200/50", hex: "#059669" },
  FOCUS: { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700", hover: "hover:bg-indigo-100 hover:shadow-indigo-200/50", hex: "#4f46e5" },
  PAIN_RELIEF: { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700", hover: "hover:bg-pink-100 hover:shadow-pink-200/50", hex: "#db2777" },
  ENERGY: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", hover: "hover:bg-amber-100 hover:shadow-amber-200/50", hex: "#d97706" },
  SLEEP: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", hover: "hover:bg-purple-100 hover:shadow-purple-200/50", hex: "#7c3aed" },
  CREATIVITY: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", hover: "hover:bg-orange-100 hover:shadow-orange-200/50", hex: "#ea580c" },
  EUPHORIA: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", hover: "hover:bg-amber-100 hover:shadow-amber-200/50", hex: "#d97706" },
} as const;

export const EFFECT_LABELS: Record<string, string> = {
  RELAXATION: "Relaxation",
  FOCUS: "Focus",
  PAIN_RELIEF: "Pain Relief",
  ENERGY: "Energy",
  SLEEP: "Sleep",
  CREATIVITY: "Creativity",
  EUPHORIA: "Euphoria",
};

export type EffectKey = keyof typeof EFFECT_COLORS;
