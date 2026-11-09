export const topics = {
  lever:     { title: 'लीवर', threeD: true },
  body:      { title: 'मानव शरीर', threeD: false, note: 'शरीर का 3D मॉडल (हड्डियाँ, अंग) अभी जोड़ना बाकी है।' },
  physics:   { title: 'भौतिकी', threeD: false },
  chemistry: { title: 'रसायन', threeD: false, note: 'बॉन्ड बनने का 3D दृश्य अभी जोड़ना बाकी है।' },
  notes:     { title: 'नोट्स', threeD: false, note: 'नोट्स की फोटो से साफ़ नोट्स बनाने का फीचर अभी बाकी है।' },
};

// AI बैकएंड का URL बाद में यहाँ जुड़ेगा। API key ऐप के अंदर कभी न रखें, उसे सर्वर पर रखें।
export async function solvePhysics(question) {
  return { ok: false, message: 'AI बैकएंड अभी जुड़ा नहीं है, इसलिए यह सवाल अभी हल नहीं हो सकता।' };
}

// Jarvis या दूसरे कंट्रोलर के लिए: ऐप के काम नाम से चलाने की सूची
export const commands = {};
export function registerCommand(name, fn) { commands[name] = fn; }
