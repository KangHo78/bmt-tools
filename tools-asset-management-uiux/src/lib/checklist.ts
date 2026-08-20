export const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  "TWL-DRL": ["Baterai", "Charger", "Kotak", "Buku Panduan"],
  "TWL-GRD": ["Kaca Pelindung", "Mata Gerinda", "Kunci Pas"],
  "TWL-TRQ": ["Sertifikat Kalibrasi", "Kotak Presisi"],
  "TWL-MLT": ["Probe", "Baterai 9V", "Kotak"],
  "TWL-TGA": ["Kunci Pengaman Kaki", "Karet Alas"],
  "TWL-LAS": ["Kabel Ground", "Topeng Las", "Sarung Tangan"],
  "TWL-KMP": ["Selang Udara", "Manometer"],
  "TWL-LSR": ["Kotak Keras", "Tripod", "Kacamata Laser"],
  "TWL-HLM": ["Tali Dagu"],
  "TWL-HAR": ["Pengait D-Ring", "Tali Lanyard"],
};

export function checklistFor(code: string): string[] {
  return CHECKLIST_TEMPLATES[code] ?? ["Kondisi fisik", "Kelengkapan standar"];
}
