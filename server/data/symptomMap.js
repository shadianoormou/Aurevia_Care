// Dummy symptom -> keyword mapping used for the "Smart Search" AI feature.
// This is NOT medical advice - it simply maps common symptom keywords to
// OTC (over-the-counter) product categories/tags so we can suggest
// relevant products. See disclaimer shown on the frontend.

export const symptomKeywords = {
  fever: ["fever", "paracetamol", "temperature"],
  headache: ["headache", "pain relief", "migraine"],
  cough: ["cough", "throat", "syrup"],
  cold: ["cold", "flu", "nasal", "congestion"],
  "sore throat": ["throat", "lozenge", "cough"],
  "body pain": ["pain relief", "muscle", "analgesic"],
  allergy: ["allergy", "antihistamine", "itching"],
  acidity: ["acidity", "antacid", "gas"],
  "stomach pain": ["stomach", "antacid", "digestive"],
  diarrhea: ["diarrhea", "ors", "digestive"],
  constipation: ["constipation", "laxative", "digestive"],
  "skin rash": ["skin", "rash", "antiseptic", "cream"],
  "eye irritation": ["eye", "drops"],
  vomiting: ["vomiting", "nausea", "antiemetic"],
};

// Given a free-text symptom query, return an array of matching keywords
// to search against product name/description/symptoms fields
export const getKeywordsForSymptom = (query) => {
  const lowerQuery = query.toLowerCase().trim();

  // Direct match
  if (symptomKeywords[lowerQuery]) {
    return symptomKeywords[lowerQuery];
  }

  // Partial match (query contains or is contained in a known symptom)
  const matchedKey = Object.keys(symptomKeywords).find(
    (key) => key.includes(lowerQuery) || lowerQuery.includes(key)
  );

  if (matchedKey) return symptomKeywords[matchedKey];

  // Fallback: just search using the raw query
  return [lowerQuery];
};
