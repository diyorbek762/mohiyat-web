"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, Gift, Bell, FileCode, Mail, Search, Plus, Trash2, 
  CheckCircle, Loader2, DollarSign, Database, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CustomDialog from './CustomDialog';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');

  // Promocodes State
  const [promocodes, setPromocodes] = useState<any[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoReward, setNewPromoReward] = useState('');

  // Alerts State
  const [alerts, setAlerts] = useState<any[]>([]);
  const [newAlertMessage, setNewAlertMessage] = useState('');

  // Email State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Scams State
  const [scams, setScams] = useState<any[]>([]);
  const [editingScam, setEditingScam] = useState<any>(null);
  const [isCreatingScam, setIsCreatingScam] = useState(false);

  // Dialog State
  const [coinDialog, setCoinDialog] = useState<{isOpen: boolean, userId: string | null}>({ isOpen: false, userId: null });
  const [errorDialog, setErrorDialog] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: '' });
  const [deleteScamDialog, setDeleteScamDialog] = useState<{isOpen: boolean, scam_id: string | null}>({ isOpen: false, scam_id: null });

  // Fetch functions based on tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'users') {
        const { data, error } = await supabase.rpc('get_all_users');
        if (error) throw error;
        setUsers(data || []);
      } else if (activeTab === 'promocodes') {
        const { data, error } = await supabase.from('promocodes').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setPromocodes(data || []);
      } else if (activeTab === 'alerts') {
        const { data, error } = await supabase.from('app_alerts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setAlerts(data || []);
      } else if (activeTab === 'scams') {
        const { data, error } = await supabase.from('scam_patterns').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setScams(data || []);
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Handlers
  const handleAddCoin = (userId: string) => {
    setCoinDialog({ isOpen: true, userId });
  };

  const handleConfirmAddCoin = async (amountStr?: string) => {
    const amount = Number(amountStr);
    if (!amountStr || isNaN(amount) || amount <= 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('add_coins_to_user', { target_id: coinDialog.userId, amount });
      if (error) throw error;
      showSuccess(`${amount} ta coin qo'shildi!`);
      setCoinDialog({ isOpen: false, userId: null });
      fetchData();
    } catch (e: any) {
      setCoinDialog({ isOpen: false, userId: null });
      setErrorDialog({ isOpen: true, message: e.message || "Xatolik yuz berdi" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromo = async () => {
    if (!newPromoCode || !newPromoReward) return;
    try {
      const { error } = await supabase.from('promocodes').insert({
        code: newPromoCode.toUpperCase(),
        reward: Number(newPromoReward),
      });
      if (error) throw error;
      setNewPromoCode('');
      setNewPromoReward('');
      showSuccess("Promokod yaratildi!");
      fetchData();
    } catch (e: any) {
      alert("Xato: " + e.message);
    }
  };

  const handleCreateAlert = async () => {
    if (!newAlertMessage) return;
    try {
      // First disable active alerts
      await supabase.from('app_alerts').update({ is_active: false }).eq('is_active', true);
      const { error } = await supabase.from('app_alerts').insert({
        message: newAlertMessage,
        is_active: true
      });
      if (error) throw error;
      setNewAlertMessage('');
      showSuccess("Xabarnoma yuborildi!");
      fetchData();
    } catch (e: any) {
      alert("Xato: " + e.message);
    }
  };

  const handleDisableAlert = async (id: string) => {
    try {
      const { error } = await supabase.from('app_alerts').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert("Xato: " + e.message);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) return;
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ subject: emailSubject, body: emailBody })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Email yuborishda xato");
      }
      
      setEmailSubject('');
      setEmailBody('');
      showSuccess("Barcha pochtalarga yuborildi!");
    } catch (e: any) {
      alert("Xato: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScam = async () => {
    if (!editingScam) return;
    try {
      setLoading(true);
      
      const payload: any = { 
        title: editingScam.title,
        description: editingScam.description,
        real_example: editingScam.real_example,
        match_criteria: editingScam.match_criteria,
        severity: editingScam.severity || 'high',
        is_active: true
      };

      if (editingScam.id) {
        payload.id = editingScam.id;
      }

      const { error } = await supabase
        .from('scam_patterns')
        .upsert(payload);
        
      if (error) throw error;
      setEditingScam(null);
      setIsCreatingScam(false);
      showSuccess("Firibgarlik sxemasi saqlandi!");
      fetchData();
    } catch (e: any) {
      alert("Xato: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScam = (scam_id: string) => {
    setDeleteScamDialog({ isOpen: true, scam_id });
  };

  const handleConfirmDeleteScam = async () => {
    if (!deleteScamDialog.scam_id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('scam_patterns').delete().eq('id', deleteScamDialog.scam_id);
      if (error) throw error;
      showSuccess("Sxema o'chirildi!");
      setDeleteScamDialog({ isOpen: false, scam_id: null });
      fetchData();
    } catch (e: any) {
      setDeleteScamDialog({ isOpen: false, scam_id: null });
      setErrorDialog({ isOpen: true, message: e.message || "O'chirishda xatolik yuz berdi" });
    } finally {
      setLoading(false);
    }
  };

  // Sub-renders
  const renderUsers = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
        <input 
          type="text" 
          placeholder="Ism yoki pochta orqali qidirish..." 
          value={searchUser}
          onChange={e => setSearchUser(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Foydalanuvchi</th>
              <th className="px-6 py-4">Telefon</th>
              <th className="px-6 py-4">Balans</th>
              <th className="px-6 py-4 text-right">Harakat</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => (u.full_name?.toLowerCase() || '').includes(searchUser.toLowerCase()) || (u.id || '').includes(searchUser)).map(user => (
              <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{user.full_name || 'Noma`lum'}</div>
                  <div className="text-xs text-slate-500">{user.email || user.id}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{user.phone || '-'}</td>
                <td className="px-6 py-4 font-bold text-amber-600">{user.balance} Coin</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleAddCoin(user.id)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 ml-auto">
                    <DollarSign className="w-3 h-3" /> Coin Qo'shish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPromos = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-blue-800 mb-1">Kod nomi</label>
          <input type="text" value={newPromoCode} onChange={e => setNewPromoCode(e.target.value)} placeholder="YANGI_YIL_10" className="w-full px-4 py-2.5 rounded-xl border border-blue-200" />
        </div>
        <div className="w-32">
          <label className="block text-xs font-bold text-blue-800 mb-1">Tangalar</label>
          <input type="number" value={newPromoReward} onChange={e => setNewPromoReward(e.target.value)} placeholder="10" className="w-full px-4 py-2.5 rounded-xl border border-blue-200" />
        </div>
        <button onClick={handleCreatePromo} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yaratish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promocodes.map(promo => (
          <div key={promo.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-black text-lg tracking-wider text-slate-800">{promo.code}</h3>
              <p className="text-sm text-slate-500">Mukofot: <span className="font-bold text-amber-600">{promo.reward} Coin</span></p>
              <p className="text-xs text-slate-400 mt-1">Ishlatildi: {promo.used_count} marta</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${promo.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {promo.is_active ? 'Faol' : 'O`chirilgan'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-4">
        <div>
          <label className="block text-xs font-bold text-amber-800 mb-1">Xabar matni</label>
          <textarea value={newAlertMessage} onChange={e => setNewAlertMessage(e.target.value)} rows={3} placeholder="Saytda 10:00 gacha texnik ishlar olib boriladi..." className="w-full px-4 py-2.5 rounded-xl border border-amber-200 resize-none"></textarea>
        </div>
        <button onClick={handleCreateAlert} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 w-full justify-center">
          <Bell className="w-4 h-4" /> Barchaga Yuborish (Dashboard'da chiqadi)
        </button>
      </div>

      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className={`p-4 rounded-xl border ${alert.is_active ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
            <p className="text-slate-800 font-medium">{alert.message}</p>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-slate-400">{new Date(alert.created_at).toLocaleString()}</span>
              {alert.is_active && (
                <button onClick={() => handleDisableAlert(alert.id)} className="text-xs font-bold text-red-600 hover:text-red-700">O'chirish</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEmail = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-800">Email Xat Yuborish</h2>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Mavzu (Subject)</label>
          <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Yangi funksiyalar qo'shildi!" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500" />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Xat matni</label>
          <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6} placeholder="Hurmatli mijoz..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
        </div>

        <button onClick={handleSendEmail} disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 w-full transition-colors disabled:opacity-70">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-5 h-5" /> Barcha mijozlarga jo'natish</>}
        </button>
      </div>
    </div>
  );

  const renderScams = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-bold text-slate-800">Firibgarlik Sxemalari (Scams)</h2>
        </div>
        {!editingScam && !isCreatingScam && (
          <button 
            onClick={() => {
              setEditingScam({
                title: '', description: '', real_example: '', match_criteria: '', severity: 'high'
              });
              setIsCreatingScam(true);
            }} 
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Yangi Firibgarlik
          </button>
        )}
      </div>

      {editingScam ? (
        <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-slate-800">{isCreatingScam ? "Yangi Firibgarlik Qo'shish" : `Tahrirlash: ${editingScam.title}`}</h3>
          
          <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomi (Title)</label>
              <input type="text" value={editingScam.title || ''} onChange={e => setEditingScam({...editingScam, title: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Masalan: Novostroyka muddatsiz qurilish" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qisqacha Ta'rif (Description)</label>
              <input type="text" value={editingScam.description || ''} onChange={e => setEditingScam({...editingScam, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Bu firibgarlik qanday ishlaydi..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hayotiy Misol (Real Example)</label>
              <input type="text" value={editingScam.real_example || ''} onChange={e => setEditingScam({...editingScam, real_example: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Masalan: 2023-yilda X kompaniya 450 kishini aldagan..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">AI Aniqlash Shartlari (Match Criteria)</label>
              <textarea
                value={editingScam.match_criteria || ''}
                onChange={(e) => setEditingScam({ ...editingScam, match_criteria: e.target.value })}
                rows={4}
                className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-500 text-sm resize-y"
                placeholder="Agar shartnomada shunday so'zlar bo'lsa: ..."
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Xavflilik Darajasi (Severity)</label>
              <select value={editingScam.severity || 'high'} onChange={e => setEditingScam({...editingScam, severity: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="high">O'ta xavfli (High)</option>
                <option value="medium">O'rtacha (Medium)</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setEditingScam(null); setIsCreatingScam(false); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
              Bekor qilish
            </button>
            <button onClick={handleSaveScam} disabled={loading || !editingScam.title} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Saqlash</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {scams.map(scam => (
            <div key={scam.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 opacity-20 rounded-bl-full`}></div>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <h4 className="font-bold text-slate-800">{scam.title}</h4>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${scam.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {scam.severity}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{scam.description}</p>
              <div className="bg-slate-50 p-3 rounded-lg mb-4 text-xs italic text-slate-600 border border-slate-100">
                <strong>Hayotiy misol:</strong> {scam.real_example}
              </div>
              <div className="flex gap-2 mt-auto">
                <button 
                  onClick={() => setEditingScam(scam)} 
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors border border-slate-200"
                >
                  Tahrirlash
                </button>
                <button 
                  onClick={() => handleDeleteScam(scam.id)} 
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors border border-red-100 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 w-full h-full overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 lg:py-5 shrink-0">
        <h1 className="text-xl lg:text-2xl font-black text-slate-900">Boshqaruv Paneli (Admin)</h1>
        <p className="text-slate-500 text-xs lg:text-sm mt-1">SaaS platformasi sozlamalari</p>
      </div>
      
      {successMsg && (
        <div className="bg-green-500 text-white px-6 py-3 flex items-center gap-2 font-medium">
          <CheckCircle className="w-5 h-5" /> {successMsg}
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar tabs for Admin */}
        <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-2 lg:p-4 shrink-0 overflow-x-auto lg:overflow-y-auto flex lg:flex-col gap-2">
          {[
            { id: 'users', icon: Users, label: 'Foydalanuvchilar' },
            { id: 'promocodes', icon: Gift, label: 'Promokodlar' },
            { id: 'alerts', icon: Bell, label: 'Xabarnomalar' },
            { id: 'email', icon: Mail, label: 'Email Jo`natish' },
            { id: 'scams', icon: AlertTriangle, label: 'Firibgarlik (Scam)' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 w-auto lg:w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3.5 rounded-xl font-bold transition-all lg:mb-2 ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <tab.icon className="w-4 h-4 lg:w-5 lg:h-5" /> <span className="whitespace-nowrap text-sm lg:text-base">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {errorMsg && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl font-medium">{errorMsg}</div>}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'promocodes' && renderPromos()}
          {activeTab === 'alerts' && renderAlerts()}
          {activeTab === 'email' && renderEmail()}
          {activeTab === 'scams' && renderScams()}
        </div>
      </div>

      <CustomDialog 
        isOpen={coinDialog.isOpen}
        type="prompt"
        theme="amber"
        title="Coin Qo'shish"
        description="Foydalanuvchiga qancha coin qo'shmoqchisiz? Miqdorni kiriting."
        placeholder="Masalan: 10"
        isLoading={loading}
        onClose={() => setCoinDialog({ isOpen: false, userId: null })}
        onConfirm={handleConfirmAddCoin}
      />

      <CustomDialog 
        isOpen={deleteScamDialog.isOpen}
        type="confirm"
        theme="red"
        title="Firibgarlik Sxemasini O'chirish"
        description="Rostdan ham ushbu firibgarlik sxemasini o'chirib tashlamoqchimisiz? Buni ortga qaytarib bo'lmaydi."
        confirmText="O'chirish"
        isLoading={loading}
        onClose={() => setDeleteScamDialog({ isOpen: false, scam_id: null })}
        onConfirm={handleConfirmDeleteScam}
      />

      <CustomDialog 
        isOpen={errorDialog.isOpen}
        type="alert"
        theme="red"
        title="Xatolik"
        description={errorDialog.message}
        onClose={() => setErrorDialog({ isOpen: false, message: '' })}
        onConfirm={() => setErrorDialog({ isOpen: false, message: '' })}
      />
    </div>
  );
}
