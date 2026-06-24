"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, Gift, Bell, FileCode, Mail, Search, Plus, Trash2, 
  CheckCircle, Loader2, DollarSign, Database
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

  // Rules State
  const [rules, setRules] = useState<any[]>([]);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  // Dialog State
  const [coinDialog, setCoinDialog] = useState<{isOpen: boolean, userId: string | null}>({ isOpen: false, userId: null });
  const [errorDialog, setErrorDialog] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: '' });
  const [deleteRuleDialog, setDeleteRuleDialog] = useState<{isOpen: boolean, doc_type: string | null}>({ isOpen: false, doc_type: null });

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
      } else if (activeTab === 'rules') {
        const { data, error } = await supabase.from('document_rules').select('*').order('doc_type', { ascending: true });
        if (error) throw error;
        setRules(data || []);
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

  const handleSaveRule = async () => {
    if (!editingRule) return;
    try {
      setLoading(true);
      
      // Upsert (Insert or Update)
      const { error } = await supabase
        .from('document_rules')
        .upsert({ 
          doc_type: editingRule.doc_type,
          label: editingRule.label || editingRule.doc_type,
          description: editingRule.description || '',
          icon_name: editingRule.icon_name || 'FileText',
          color_gradient: editingRule.color_gradient || 'from-slate-500 to-slate-700',
          rules_text: editingRule.rules_text,
          is_active: true
        });
        
      if (error) throw error;
      setEditingRule(null);
      setIsCreatingRule(false);
      showSuccess("Muvaffaqiyatli saqlandi!");
      fetchData();
    } catch (e: any) {
      alert("Xato: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = (doc_type: string) => {
    setDeleteRuleDialog({ isOpen: true, doc_type });
  };

  const handleConfirmDeleteRule = async () => {
    if (!deleteRuleDialog.doc_type) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('document_rules').delete().eq('doc_type', deleteRuleDialog.doc_type);
      if (error) throw error;
      showSuccess("Hujjat turi o'chirildi!");
      setDeleteRuleDialog({ isOpen: false, doc_type: null });
      fetchData();
    } catch (e: any) {
      setDeleteRuleDialog({ isOpen: false, doc_type: null });
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

  const renderRules = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <FileCode className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-800">AI Promptlari va Turlari</h2>
        </div>
        {!editingRule && !isCreatingRule && (
          <button 
            onClick={() => {
              setEditingRule({
                doc_type: '', label: '', description: '', icon_name: 'FileText', color_gradient: 'from-slate-500 to-slate-700', rules_text: ''
              });
              setIsCreatingRule(true);
            }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Yangi Tur
          </button>
        )}
      </div>

      {editingRule ? (
        <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-slate-800">{isCreatingRule ? "Yangi Hujjat Turini Yaratish" : `Tahrirlash: ${editingRule.label || editingRule.doc_type}`}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID (Faqat inglizcha harflar)</label>
              <input type="text" value={editingRule.doc_type} disabled={!isCreatingRule} onChange={e => setEditingRule({...editingRule, doc_type: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-50" placeholder="masalan: new_law" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomi (Label)</label>
              <input type="text" value={editingRule.label || ''} onChange={e => setEditingRule({...editingRule, label: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Yangi Qonun" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qisqacha Ta'rif (Description)</label>
              <input type="text" value={editingRule.description || ''} onChange={e => setEditingRule({...editingRule, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Hujjat haqida ma'lumot..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ikonka (IconName)</label>
              <select value={editingRule.icon_name || 'FileText'} onChange={e => setEditingRule({...editingRule, icon_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="FileText">FileText (Hujjat)</option>
                <option value="Scale">Scale (Tarozi)</option>
                <option value="Building2">Building2 (Bino)</option>
                <option value="User">User (Odam)</option>
                <option value="Home">Home (Uy)</option>
                <option value="Monitor">Monitor (Texnika)</option>
                <option value="ShoppingCart">ShoppingCart (Savdo)</option>
                <option value="Book">Book (Kitob)</option>
                <option value="Shield">Shield (Qalqon)</option>
                <option value="Briefcase">Briefcase (Portfel)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rang (Gradient)</label>
              <select value={editingRule.color_gradient || 'from-slate-500 to-slate-700'} onChange={e => setEditingRule({...editingRule, color_gradient: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="from-slate-500 to-slate-700">Kulrang (Slate)</option>
                <option value="from-blue-500 to-indigo-500">Ko'k-Binafsha (Blue-Indigo)</option>
                <option value="from-emerald-400 to-emerald-600">Yashil (Emerald)</option>
                <option value="from-orange-400 to-orange-600">Apelsin (Orange)</option>
                <option value="from-purple-500 to-purple-700">Binafsha (Purple)</option>
                <option value="from-cyan-500 to-cyan-700">Moviy (Cyan)</option>
                <option value="from-red-500 to-red-700">Qizil (Red)</option>
                <option value="from-yellow-500 to-amber-600">Sariq (Yellow-Amber)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">AI uchun Qoidalar (System Prompt)</label>
            <p className="text-xs text-slate-500 font-medium mb-2">Bu yerda yozilgan qoidalar AI ga yuboriladigan tizim xabariga qo'shiladi.</p>
            <textarea
              value={editingRule.rules_text}
              onChange={(e) => setEditingRule({ ...editingRule, rules_text: e.target.value })}
              rows={8}
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-y"
              placeholder="1. ...&#10;2. ..."
            ></textarea>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setEditingRule(null); setIsCreatingRule(false); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
              Bekor qilish
            </button>
            <button onClick={handleSaveRule} disabled={loading || !editingRule.doc_type} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Saqlash</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map(rule => (
            <div key={rule.doc_type} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${rule.color_gradient || 'from-slate-100 to-slate-200'} opacity-10 rounded-bl-full`}></div>
              <div className="flex justify-between items-center mb-2 relative z-10">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200">{rule.label || rule.doc_type}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">{rule.doc_type}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{rule.description}</p>
              <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1 font-medium">{rule.rules_text}</p>
              <div className="flex gap-2 mt-auto">
                <button 
                  onClick={() => setEditingRule(rule)} 
                  className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-sm transition-colors border border-indigo-100"
                >
                  Tahrirlash
                </button>
                <button 
                  onClick={() => handleDeleteRule(rule.doc_type)} 
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
            { id: 'rules', icon: FileCode, label: 'AI Qoidalari' },
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
          {activeTab === 'rules' && renderRules()}
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
        isOpen={deleteRuleDialog.isOpen}
        type="confirm"
        theme="red"
        title="Hujjat Turini O'chirish"
        description="Rostdan ham ushbu hujjat turini (kategoriyasini) o'chirib tashlamoqchimisiz? Buni ortga qaytarib bo'lmaydi."
        confirmText="O'chirish"
        isLoading={loading}
        onClose={() => setDeleteRuleDialog({ isOpen: false, doc_type: null })}
        onConfirm={handleConfirmDeleteRule}
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
