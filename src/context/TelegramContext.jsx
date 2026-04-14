import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { moodDatabase } from '../data/moodMessages.js';

const TelegramContext = createContext();

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "8511793687:AAGtCOV-QhKjgZxR4XqimtmjyKvtFpcuso8";
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || "1023544625";

export function TelegramProvider({ children }) {
  const [lastUpdateId, setLastUpdateId] = useState(() => parseInt(localStorage.getItem('mori_last_update_id') || '0', 10));
  const isPollingRef = useRef(false);
  
  // Listeners
  const listenersRef = useRef({
    onReply: new Set(),
    onNote: new Set(),
    onPulse: new Set()
  });

  const getTelegramFileUrl = async (file_id) => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${file_id}`);
      const data = await res.json();
      if (data.ok) {
        return `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${data.result.file_path}`;
      }
    } catch (e) {
      console.error("Error getting Telegram file path", e);
    }
    return null;
  };

  const poll = useCallback(async () => {
    if (isPollingRef.current || document.visibilityState !== 'visible') return;
    isPollingRef.current = true;

    try {
      const currentLastId = parseInt(localStorage.getItem('mori_last_update_id') || '0', 10);
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${currentLastId + 1}&timeout=30`);
      
      // Handle Conflict 409 gracefully
      if (res.status === 409) {
        console.warn("Telegram Poll Conflict (409). Other instance active.");
        isPollingRef.current = false;
        return;
      }

      const data = await res.json();

      if (data.ok && data.result.length > 0) {
        let maxId = currentLastId;

        for (const update of data.result) {
          maxId = Math.max(maxId, update.update_id);

          // Handle Callback Queries (SafeBox Buttons)
          if (update.callback_query) {
            const replyText = update.callback_query.data;
            let toastText = "";
            if (replyText === "reply_received") toastText = "💙 خالد: وصلتني";
            if (replyText === "reply_pray") toastText = "🤲 خالد: بدعيلك";
            if (replyText === "reply_ok") toastText = "✨ خالد: أنتِ بخير";
            
            if (toastText) {
              listenersRef.current.onReply.forEach(cb => cb(toastText));
            }
            
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ callback_query_id: update.callback_query.id })
            });
          }

          // Handle Messages (Notes, Pulse, Reasons, Garden)
          if (update.message && String(update.message.chat.id) === String(TELEGRAM_CHAT_ID)) {
            const text = update.message.text?.trim() || "";
            
            // Pulse / Heart
            if (text === '/pulse' || text === '/heart') {
              const pulseSignal = { id: update.message.message_id, timestamp: Date.now() };
              localStorage.setItem('mori_pulse_signal', JSON.stringify(pulseSignal));
              listenersRef.current.onPulse.forEach(cb => cb(pulseSignal));
              continue; 
            }

            // Reason / Jar
            if (text.startsWith('/reason ')) {
              const reason = text.replace('/reason ', '').trim();
              if (reason) {
                const jar = JSON.parse(localStorage.getItem('mori_reasons_jar') || '[]');
                if (!jar.some(item => item.id === update.message.message_id)) {
                  jar.push({ id: update.message.message_id, text: reason, timestamp: Date.now(), archived: false });
                  localStorage.setItem('mori_reasons_jar', JSON.stringify(jar));
                }
              }
              continue;
            }

            // Permanent Remote Message (/msg Title | Content)
            if (text.startsWith('/msg ')) {
              const parts = text.replace('/msg ', '').split('|');
              const title = parts[0]?.trim() || "رسالة من قلب خالد";
              const content = parts[1]?.trim() || "";
              if (content || update.message.photo) {
                const remoteMsgs = JSON.parse(localStorage.getItem('mori_remote_messages') || '[]');
                if (!remoteMsgs.some(m => m.id === `remote-${update.message.message_id}`)) {
                  let media = [];
                  if (update.message.photo) {
                    const photo = update.message.photo[update.message.photo.length - 1];
                    const url = await getTelegramFileUrl(photo.file_id);
                    if (url) media.push({ url, type: 'image' });
                  }
                  remoteMsgs.push({
                    id: `remote-${update.message.message_id}`,
                    title,
                    text: content,
                    media,
                    createdAt: Date.now(),
                    isRemote: true
                  });
                  localStorage.setItem('mori_remote_messages', JSON.stringify(remoteMsgs));
                  listenersRef.current.onReply.forEach(cb => cb("✨ تمت إضافة رسالة دائمة للموقع"));
                }
              }
              continue;
            }

            // Permanent Remote Tip (/tip Content)
            if (text.startsWith('/tip ')) {
              const content = text.replace('/tip ', '').trim();
              if (content) {
                const remoteTips = JSON.parse(localStorage.getItem('mori_remote_tips') || '[]');
                if (!remoteTips.some(t => t.id === `remote-tip-${update.message.message_id}`)) {
                  remoteTips.push({
                    id: `remote-tip-${update.message.message_id}`,
                    text: content,
                    title: "نصيحة إضافية من خالد",
                    createdAt: Date.now(),
                    isRemote: true
                  });
                  localStorage.setItem('mori_remote_tips', JSON.stringify(remoteTips));
                  listenersRef.current.onReply.forEach(cb => cb("💡 تمت إضافة نصيحة جديدة للموقع"));
                }
              }
              continue;
            }

            // Garden Water
            if (text === '/water') {
              const points = parseInt(localStorage.getItem('mori_garden_points') || '0', 10);
              localStorage.setItem('mori_garden_points', (points + 5).toString());
              localStorage.setItem('mori_last_watered', Date.now().toString());
              continue;
            }

            // LiveNote (Rich Media)
            let noteObj = null;
            if (update.message.photo) {
              const photo = update.message.photo[update.message.photo.length - 1];
              const url = await getTelegramFileUrl(photo.file_id);
              if (url) noteObj = { id: update.message.message_id, type: 'image', url, text: update.message.caption || "", timestamp: Date.now() };
            } else if (update.message.video) {
              const url = await getTelegramFileUrl(update.message.video.file_id);
              if (url) noteObj = { id: update.message.message_id, type: 'video', url, text: update.message.caption || "", timestamp: Date.now() };
            } else if (update.message.video_note) {
              const url = await getTelegramFileUrl(update.message.video_note.file_id);
              if (url) noteObj = { id: update.message.message_id, type: 'video_note', url, text: "", timestamp: Date.now() };
            } else if (text) {
              let noteContent = text.startsWith('/note ') ? text.replace('/note ', '').trim() : (!text.startsWith('/') ? text : "");
              if (noteContent) noteObj = { id: update.message.message_id, type: 'text', text: noteContent, timestamp: Date.now() };
            }

            if (noteObj) {
              localStorage.setItem('mori_live_note', JSON.stringify(noteObj));
              listenersRef.current.onNote.forEach(cb => cb(noteObj));
            }
          }
        }
        
        localStorage.setItem('mori_last_update_id', maxId.toString());
        setLastUpdateId(maxId);
      }
    } catch (e) {
      console.error("Polling error:", e);
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(poll, 15000); // Poll more frequently since it's shared
    poll(); // Initial poll
    return () => clearInterval(intervalId);
  }, [poll]);

  // Subscription methods
  const subscribe = useCallback((type, callback) => {
    if (listenersRef.current[type]) {
      listenersRef.current[type].add(callback);
    }
    return () => {
      if (listenersRef.current[type]) {
        listenersRef.current[type].delete(callback);
      }
    };
  }, []);

  const value = {
    subscribe,
    TELEGRAM_TOKEN,
    TELEGRAM_CHAT_ID,
    getTelegramFileUrl
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
}
