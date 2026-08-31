export const MOVEMENT_COLOR_STYLES: Record<string, { base: string; active: string; label: string }> = {
  indigo: {
    base: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/25 hover:bg-brand-indigo/20",
    active: "ring-1.5 ring-brand-indigo bg-brand-indigo/25 text-brand-indigo font-black border-brand-indigo/55",
    label: "bg-brand-indigo/20 text-brand-indigo border-brand-indigo/35"
  },
  rose: {
    base: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
    active: "ring-1.5 ring-rose-500 bg-rose-100 text-rose-800 font-black border-rose-300",
    label: "bg-rose-100 text-rose-800 border-rose-200"
  },
  emerald: {
    base: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    active: "ring-1.5 ring-emerald-500 bg-emerald-100 text-emerald-800 font-black border-emerald-300",
    label: "bg-emerald-100 text-emerald-800 border-emerald-200"
  },
  amber: {
    base: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    active: "ring-1.5 ring-amber-500 bg-amber-100 text-amber-800 font-black border-amber-300",
    label: "bg-amber-100 text-amber-800 border-amber-200"
  },
  sky: {
    base: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
    active: "ring-1.5 ring-sky-500 bg-sky-100 text-sky-800 font-black border-sky-300",
    label: "bg-sky-100 text-sky-800 border-sky-200"
  },
  violet: {
    base: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
    active: "ring-1.5 ring-violet-500 bg-violet-100 text-violet-800 font-black border-violet-300",
    label: "bg-violet-100 text-violet-800 border-violet-200"
  },
  teal: {
    base: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
    active: "ring-1.5 ring-teal-500 bg-teal-100 text-teal-800 font-black border-teal-300",
    label: "bg-teal-100 text-teal-800 border-teal-200"
  },
  orange: {
    base: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    active: "ring-1.5 ring-orange-500 bg-orange-100 text-orange-800 font-black border-orange-300",
    label: "bg-orange-100 text-orange-800 border-orange-200"
  }
};

export const AVAILABLE_MOVEMENT_COLORS = ["indigo", "rose", "emerald", "amber", "sky", "violet", "teal", "orange"];
