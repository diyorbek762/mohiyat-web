"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  link_url: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasTelegram, setHasTelegram] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    let channel: any;

    async function fetchNotifications() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setUserId(session.user.id);

      // Check if user has telegram connected
      const { data: profile } = await supabase
        .from("profiles")
        .select("telegram_id")
        .eq("id", session.user.id)
        .single();
        
      if (profile && !profile.telegram_id) {
        setHasTelegram(false);
      }

      const { data } = await supabase
        .from("app_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setNotifications(data);

      // Realtime subscription
      channel = supabase
        .channel("public:app_notifications")
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'app_notifications' },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);
          }
        )
        .subscribe();
    }

    fetchNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notif: Notification) => {
    setIsOpen(false);
    if (!notif.is_read) {
      // Mark as read optimistically
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ notification_id: notif.id }),
        });
      }
    }
    if (notif.link_url) {
      router.push(notif.link_url);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Bildirishnomalar</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {unreadCount} ta yangi
                </span>
              )}
            </div>
            
            {/* Telegram Deep Link Banner */}
            {!hasTelegram && userId && (
              <a 
                href={`https://t.me/mohiyat_ai_bot?start=${userId}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full bg-gradient-to-r from-blue-500 to-indigo-600 p-3 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-between"
              >
                <span>Telegram botimizga ulaning 🚀</span>
                <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">Ulash</span>
              </a>
            )}
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Hozircha hech qanday bildirishnoma yo'q
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 items-start ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm truncate ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 uppercase font-semibold tracking-wider">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: uz })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
