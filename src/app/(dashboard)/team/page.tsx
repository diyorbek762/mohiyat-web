"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TeamPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamData() {
      // Get the organizations the user belongs to
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, balance");

      if (orgData && !orgError) {
        setOrgs(orgData);
        
        if (orgData.length > 0) {
          // Fetch members for the first org for now
          const { data: memberData } = await supabase
            .from("organization_members")
            .select("user_id, role, created_at")
            .eq("org_id", orgData[0].id);
            
          if (memberData) setMembers(memberData);
        }
      }
      setLoading(false);
    }
    fetchTeamData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-white/50">Yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            B2B Jamoa
          </h1>
          <p className="text-white/60">Tashkilotingiz xodimlari va hisobi.</p>
        </div>
        
        {orgs.length > 0 && (
          <div className="bg-[#1C1C1E] border border-white/10 rounded-xl p-4 text-right">
            <div className="text-sm text-white/50 mb-1">Umumiy Balans</div>
            <div className="text-2xl font-bold text-yellow-400 flex items-center gap-2 justify-end">
              <span>🪙</span> {orgs[0].balance}
            </div>
          </div>
        )}
      </div>

      {orgs.length === 0 ? (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-xl font-bold mb-2">Tashkilot ochilmagan</h2>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            Xodimlaringiz bilan bitta hisobda ishlash va shartnomalarni boshqarish uchun kompaniya profilini yarating.
          </p>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            Tashkilot Yaratish
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{orgs[0].name} Xodimlari</h2>
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-white/10">
              + Xodim qo'shish
            </button>
          </div>
          
          <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 text-white/50 font-medium text-sm">Foydalanuvchi ID</th>
                  <th className="p-4 text-white/50 font-medium text-sm">Rol</th>
                  <th className="p-4 text-white/50 font-medium text-sm text-right">Harakatlar</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => (
                  <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono text-sm text-white/80">{member.user_id}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        member.role === 'owner' ? 'bg-purple-500/20 text-purple-400' :
                        member.role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {member.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {member.role !== 'owner' && (
                        <button className="text-red-400 hover:text-red-300 text-sm">
                          O'chirish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
