import { Building2, FileText, User, Lock, Scale, Home, Monitor, ShoppingCart, Book } from "lucide-react";

export const DOCUMENT_TYPES = [
  { id: 'civil_code', label: 'Fuqarolik Kodeksi', desc: 'Umumiy shartnomaviy huquqiy munosabatlar', icon: Scale, color: 'from-blue-500 to-indigo-500' },
  { id: 'tax_code', label: 'Soliq kodeksi', desc: 'Soliq majburiyatlari va to\'lovlar', icon: FileText, color: 'from-emerald-400 to-emerald-600' },
  { id: 'labor_code', label: 'Mehnat Kodeksi', desc: 'Xodim va ish beruvchi munosabatlari', icon: User, color: 'from-blue-400 to-blue-600' },
  { id: 'housing_code', label: 'Uy Joy kodeksi', desc: 'Uy-joy bilan bog\'liq masalalar', icon: Home, color: 'from-orange-400 to-orange-600' },
  { id: 'business_law', label: "Xo'jalik yurituvchi subyektlar", desc: 'Shartnoma-huquqiy bazasi to\'g\'risida', icon: Building2, color: 'from-purple-500 to-purple-700' },
  { id: 'ecommerce_law', label: 'Elektron tijorat to\'g\'risida', desc: 'Onlayn savdo va xizmatlar', icon: Monitor, color: 'from-cyan-500 to-cyan-700' },
  { id: 'privacy_law', label: "Shaxsga doir ma'lumotlar", desc: 'Maxfiylik va himoya qoidalari', icon: User, color: 'from-pink-500 to-pink-700' },
  { id: 'trade_secret', label: "Tijorat siri to'g'risida", desc: "Tijorat siri va NDA", icon: Lock, color: 'from-slate-600 to-slate-800' },
  { id: 'consumer_rights', label: "Iste'molchilar huquqlari", desc: "Xaridor huquqlari va kafolat", icon: ShoppingCart, color: 'from-red-500 to-red-700' },
  { id: 'constitution', label: "Konstitutsiya", desc: "Asosiy qonun va qoidalar", icon: Book, color: 'from-yellow-500 to-amber-600' },
];


