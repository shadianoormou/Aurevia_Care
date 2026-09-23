const district = (name, ...aliases) => ({ name, aliases: [name, ...aliases] });

// Administrative names and common English/Bangla spellings only. Provider
// contacts are not inferred from this list; they must be imported from a
// source-attributed, pharmacist-reviewed directory record.
export const BANGLADESH_LOCATIONS = [
  { name: "Barishal", aliases: ["barishal", "barisal", "বরিশাল"], districts: [
    district("Barguna", "বরগুনা"), district("Barishal", "Barisal", "বরিশাল"), district("Bhola", "ভোলা"),
    district("Jhalokathi", "ঝালকাঠি"), district("Patuakhali", "পটুয়াখালী", "পটুয়াখালী"), district("Pirojpur", "পিরোজপুর"),
  ] },
  { name: "Chattogram", aliases: ["chattogram", "chittagong", "চট্টগ্রাম"], districts: [
    district("Bandarban", "বান্দরবান"), district("Brahmanbaria", "ব্রাহ্মণবাড়িয়া", "ব্রাহ্মণবাড়িয়া"), district("Chandpur", "চাঁদপুর"),
    district("Chattogram", "Chittagong", "চট্টগ্রাম"), district("Cumilla", "Comilla", "কুমিল্লা"), district("Cox's Bazar", "Cox Bazar", "কক্সবাজার"),
    district("Feni", "ফেনী"), district("Khagrachhari", "Khagrachari", "খাগড়াছড়ি", "খাগড়াছড়ি"), district("Lakshmipur", "লক্ষ্মীপুর"),
    district("Noakhali", "নোয়াখালী", "নোয়াখালী"), district("Rangamati", "রাঙ্গামাটি", "রাঙামাটি"),
  ] },
  { name: "Dhaka", aliases: ["dhaka", "ঢাকা"], districts: [
    district("Dhaka", "ঢাকা"), district("Faridpur", "ফরিদপুর"), district("Gazipur", "গাজীপুর"), district("Gopalganj", "গোপালগঞ্জ"),
    district("Kishoreganj", "কিশোরগঞ্জ"), district("Madaripur", "মাদারীপুর"), district("Manikganj", "মানিকগঞ্জ"), district("Munshiganj", "মুন্সিগঞ্জ", "মুন্সীগঞ্জ"),
    district("Narayanganj", "নারায়ণগঞ্জ", "নারায়ণগঞ্জ"), district("Narsingdi", "নরসিংদী"), district("Rajbari", "রাজবাড়ী", "রাজবাড়ী"),
    district("Shariatpur", "শরীয়তপুর", "শরিয়তপুর"), district("Tangail", "টাঙ্গাইল"),
  ] },
  { name: "Khulna", aliases: ["khulna", "খুলনা"], districts: [
    district("Bagerhat", "বাগেরহাট"), district("Chuadanga", "চুয়াডাঙ্গা", "চুয়াডাঙ্গা"), district("Jashore", "Jessore", "যশোর"),
    district("Jhenaidah", "ঝিনাইদহ"), district("Khulna", "খুলনা"), district("Kushtia", "কুষ্টিয়া", "কুষ্টিয়া"), district("Magura", "মাগুরা"),
    district("Meherpur", "মেহেরপুর"), district("Narail", "নড়াইল", "নড়াইল"), district("Satkhira", "সাতক্ষীরা"),
  ] },
  { name: "Mymensingh", aliases: ["mymensingh", "ময়মনসিংহ", "ময়মনসিংহ"], districts: [
    district("Jamalpur", "জামালপুর"), district("Mymensingh", "ময়মনসিংহ", "ময়মনসিংহ"), district("Netrokona", "নেত্রকোণা", "নেত্রকোনা"), district("Sherpur", "শেরপুর"),
  ] },
  { name: "Rajshahi", aliases: ["rajshahi", "রাজশাহী"], districts: [
    district("Bogura", "Bogra", "বগুড়া", "বগুড়া"), district("Chapainawabganj", "Nawabganj", "চাঁপাইনবাবগঞ্জ"), district("Joypurhat", "জয়পুরহাট", "জয়পুরহাট"),
    district("Naogaon", "নওগাঁ"), district("Natore", "নাটোর"), district("Pabna", "পাবনা"), district("Rajshahi", "রাজশাহী"), district("Sirajganj", "সিরাজগঞ্জ"),
  ] },
  { name: "Rangpur", aliases: ["rangpur", "রংপুর"], districts: [
    district("Dinajpur", "দিনাজপুর"), district("Gaibandha", "গাইবান্ধা"), district("Kurigram", "কুড়িগ্রাম", "কুড়িগ্রাম"), district("Lalmonirhat", "লালমনিরহাট"),
    district("Nilphamari", "নীলফামারী"), district("Panchagarh", "পঞ্চগড়", "পঞ্চগড়"), district("Rangpur", "রংপুর"), district("Thakurgaon", "ঠাকুরগাঁও"),
  ] },
  { name: "Sylhet", aliases: ["sylhet", "সিলেট"], districts: [
    district("Habiganj", "হবিগঞ্জ"), district("Moulvibazar", "মৌলভীবাজার"), district("Sunamganj", "সুনামগঞ্জ"), district("Sylhet", "সিলেট"),
  ] },
];

const normalize = (value) => String(value || "")
  .toLowerCase()
  .replace(/[’']/g, "'")
  .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const matchAlias = (message, aliases) => aliases.some((alias) => {
  const candidate = normalize(alias);
  if (!candidate) return false;
  return message === candidate || message.includes(candidate);
});

export const matchBangladeshLocation = (rawMessage) => {
  const message = normalize(rawMessage);
  if (!message) return null;
  for (const division of BANGLADESH_LOCATIONS) {
    for (const item of division.districts) {
      if (matchAlias(message, item.aliases)) {
        return { division: division.name, district: item.name, upazila: null, label: item.name === division.name ? item.name : `${item.name}, ${division.name}` };
      }
    }
    if (matchAlias(message, division.aliases)) {
      return { division: division.name, district: null, upazila: null, label: `${division.name} Division` };
    }
  }
  return null;
};

export const findDivision = (name) => BANGLADESH_LOCATIONS.find((item) => normalize(item.name) === normalize(name));

export const serializeLocationOptions = () => BANGLADESH_LOCATIONS.map((division) => ({
  name: division.name,
  districts: division.districts.map(({ name }) => ({ name })),
}));

export const normalizeLocationPart = (value) => String(value || "").trim().replace(/\s+/g, " ");
