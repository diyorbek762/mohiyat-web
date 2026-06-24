import { 
  Building2, FileText, User, Lock, Scale, Home, Monitor, ShoppingCart, Book, File, Folder, Users, Briefcase, Calculator, Map, Shield, BadgeAlert
} from "lucide-react";

export const ICON_MAP: Record<string, any> = {
  Building2, FileText, User, Lock, Scale, Home, Monitor, ShoppingCart, Book, File, Folder, Users, Briefcase, Calculator, Map, Shield, BadgeAlert
};

export const getIcon = (iconName?: string) => {
  if (!iconName) return FileText;
  return ICON_MAP[iconName] || FileText;
};
