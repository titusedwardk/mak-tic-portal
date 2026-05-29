export interface SdgDetails {
  name: string;
  color: string;
}

export function getSdgInfo(sdgNumber: number): SdgDetails {
  const sdgs: Record<number, SdgDetails> = {
    1: { name: "1. No Poverty", color: "bg-red-600 hover:bg-red-700 text-white" },
    2: { name: "2. Zero Hunger", color: "bg-amber-600 hover:bg-amber-700 text-white" },
    3: { name: "3. Good Health & Well-being", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    4: { name: "4. Quality Education", color: "bg-rose-700 hover:bg-rose-800 text-white" },
    5: { name: "5. Gender Equality", color: "bg-orange-600 hover:bg-orange-700 text-white" },
    6: { name: "6. Clean Water & Sanitation", color: "bg-sky-500 hover:bg-sky-600 text-white" },
    7: { name: "7. Affordable & Clean Energy", color: "bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" },
    8: { name: "8. Decent Work & Economic Growth", color: "bg-red-800 hover:bg-red-900 text-white" },
    9: { name: "9. Industry, Innovation & Infrastructure", color: "bg-orange-700 hover:bg-orange-800 text-white" },
    10: { name: "10. Reduced Inequalities", color: "bg-pink-600 hover:bg-pink-700 text-white" },
    11: { name: "11. Sustainable Cities & Communities", color: "bg-amber-500 hover:bg-amber-600 text-black font-semibold" },
    12: { name: "12. Responsible Consumption & Production", color: "bg-yellow-600 hover:bg-yellow-700 text-white" },
    13: { name: "13. Climate Action", color: "bg-emerald-750 hover:bg-emerald-800 text-white" },
    14: { name: "14. Life Below Water", color: "bg-blue-600 hover:bg-blue-700 text-white" },
    15: { name: "15. Life on Land", color: "bg-green-600 hover:bg-green-700 text-white" },
    16: { name: "16. Peace, Justice & Strong Institutions", color: "bg-indigo-800 hover:bg-indigo-900 text-white" },
    17: { name: "17. Partnerships for the Goals", color: "bg-blue-900 hover:bg-blue-950 text-white" },
  };
  return sdgs[sdgNumber] || { name: `SDG ${sdgNumber}`, color: "bg-slate-500 hover:bg-slate-600 text-white" };
}
