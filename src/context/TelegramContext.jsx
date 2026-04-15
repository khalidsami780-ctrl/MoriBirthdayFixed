import { useState, useEffect, useCallback, useRef } from 'react';
import { TelegramContext } from './TelegramContextCore.jsx';
import { moodDatabase } from '../data/moodMessages.js';
import { supabase } from '../lib/supabase.js';

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "8511793687:AAGtCOV-QhKjgZxR4XqimtmjyKvtFpcuso8";
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || "1023544625";

export function TelegramProvider({ children }) {
  const [lastUpdateId, setLastUpdateId] = useState(() => parseInt(localStorage.getItem('mori_last_update_id') || '0', 10));
  const [isConflict, setIsConflict] = useState(false);
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
      
      if (res.status === 409) {
        console.warn("Telegram Poll Conflict (409). Other instance active.");
        setIsConflict(true);
        isPollingRef.current = false;
        return "conflict";
      }

      setIsConflict(false);

      const data = await res.json();

      if (data.ok && data.result.length > 0) {
        let maxId = currentLastId;

        for (const update of data.result) {
          maxId = Math.max(maxId, update.update_id);

            // Callback Handling (Confirmation buttons)
            if (update.callback_query) {
              const callbackData = update.callback_query.data;
              let toastText = "";
              
              if (callbackData === "reply_received") toastText = "💙 خالد: وصلتني";
              if (callbackData === "reply_pray") toastText = "🤲 خالد: بدعيلك";
              if (callbackData === "reply_ok") toastText = "✨ خالد: أنتِ بخير";
              
              // New: Handle Voice Note Confirmation
              if (callbackData.startsWith('confirm_vn_')) {
                  const msgIdStr = callbackData.replace('confirm_vn_', '');
                  const fileId = localStorage.getItem(`pending_vn_${msgIdStr}`);
                  
                  if (fileId) {
                      const url = await getTelegramFileUrl(fileId);
                      if (url) {
                          const noteId = parseInt(msgIdStr, 10);
                          const noteObj = { id: noteId, type: 'voice', url, text: "رسالة صوتية من خالد 🎤", timestamp: Date.now() };
                          
                          const liveNotes = JSON.parse(localStorage.getItem('mori_live_notes_stack') || '[]');
                          liveNotes.push(noteObj);
                          localStorage.setItem('mori_live_notes_stack', JSON.stringify(liveNotes));
                          
                          // Sync to Supabase (Now using bigint ID and fixed table)
                          await supabase.from('live_note').upsert({ id: noteId, data: noteObj, timestamp: Date.now() });
                          listenersRef.current.onNote.forEach(cb => cb(noteObj));
                          
                          // Cleanup
                          localStorage.removeItem(`pending_vn_${msgIdStr}`);

                          // Notify user of success
                          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: "✅ تم رفع التسجيل الصوتي لموري بنجاح! ✨" })
                          });
                      }
                  } else {
                      // Handle expired or missing fileId
                      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: "⚠️ عذراً، انتهت صلاحية طلب الرفع أو حدث خطأ. برجاء إعادة إرسال الفويس نوت." })
                      });
                  }
              }

              if (callbackData.startsWith('cancel_vn_')) {
                  const msgId = callbackData.replace('cancel_vn_', '');
                  localStorage.removeItem(`pending_vn_${msgId}`);
                  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: "❌ تم إلغاء رفع التسجيل الصوتي." })
                  });
              }
              
              if (toastText) {
                listenersRef.current.onReply.forEach(cb => cb(toastText));
              }
              
              await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: update.callback_query.id })
              });
              continue;
            }

            if (update.message && String(update.message.chat.id) === String(TELEGRAM_CHAT_ID)) {
              const text = update.message.text?.trim() || "";

              // Handle Voice Note Security Flow
              if (update.message.voice) {
                  const voice = update.message.voice;
                  const msgId = update.message.message_id;
                  
                  // Store file_id locally to bypass callback_data size limit (64 bytes)
                  localStorage.setItem(`pending_vn_${msgId}`, voice.file_id);

                  // Send confirmation keyboard
                  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      chat_id: TELEGRAM_CHAT_ID, 
                      text: "🎤 تم استقبال تسجيل صوتي.. هل تريد رفعه لحالات موري المباشرة؟",
                      reply_markup: {
                        inline_keyboard: [
                          [
                            { text: "✅ نعم، ارفعه الآن", callback_data: `confirm_vn_${msgId}` },
                            { text: "❌ إلغاء", callback_data: `cancel_vn_${msgId}` }
                          ]
                        ]
                      }
                    })
                  });
                  continue;
              }

              // Pulse / Heart / Commands
              if (text.match(/^[/\\](pulse|heart|hug|status|report|withher|withyou)$/i)) {
              const cmd = text.replace(/^[/\\]/, '').toLowerCase();
              const pulseSignal = { id: update.message.message_id, type: cmd, timestamp: Date.now() };
              localStorage.setItem('mori_pulse_signal', JSON.stringify(pulseSignal));
              window.dispatchEvent(new Event('storage'));
              listenersRef.current.onPulse.forEach(cb => cb(pulseSignal));
              continue; 
            }

            // Reason
            if (text.match(/^[/\\]reason\s+/i)) {
              const reason = text.replace(/^[/\\]reason\s+/i, '').trim();
              if (reason) {
                // Keep local for immediate feedback
                const jar = JSON.parse(localStorage.getItem('mori_reasons_jar') || '[]');
                if (!jar.some(item => item.id === update.message.message_id)) {
                  const newReason = { id: update.message.message_id, text: reason, timestamp: Date.now(), archived: false };
                  jar.push(newReason);
                  localStorage.setItem('mori_reasons_jar', JSON.stringify(jar));
                  
                  // Sync to Supabase
                  await supabase.from('reasons_jar').upsert(newReason);
                }
              }
              continue;
            }

            // Message (Remote Injection)
            if (text.match(/^[/\\]msg(\s+|\n+)/i)) {
              const contentWithTitle = text.replace(/^[/\\]msg(\s+|\n+)/i, '').trim();
              const parts = contentWithTitle.split('|');
              const title = parts[0]?.trim() || "رسالة من قلب خالد";
              const content = parts[1]?.trim() || (parts.length === 1 ? parts[0]?.trim() : "");
              if (content || update.message.photo) {
                const remoteMsgs = JSON.parse(localStorage.getItem('mori_remote_messages') || '[]');
                if (!remoteMsgs.some(m => m.id === `remote-${update.message.message_id}`)) {
                  let media = [];
                  if (update.message.photo) {
                    const photo = update.message.photo[update.message.photo.length - 1];
                    const url = await getTelegramFileUrl(photo.file_id);
                    if (url) media.push({ url, type: 'image' });
                  }
                  const newMsg = {
                    id: `remote-${update.message.message_id}`,
                    title,
                    text: content,
                    media,
                    created_at: Date.now(),
                  };
                  remoteMsgs.push({ ...newMsg, isRemote: true });
                  localStorage.setItem('mori_remote_messages', JSON.stringify(remoteMsgs));
                  
                  // Sync to Supabase
                  await supabase.from('remote_messages').upsert(newMsg);
                  
                  listenersRef.current.onReply.forEach(cb => cb("✨ تمت إضافة رسالة دائمة للموقع"));
                }
              }
              continue;
            }

            // Tip (Remote Injection)
            if (text.match(/^[/\\]tip\s+/i)) {
              const content = text.replace(/^[/\\]tip\s+/i, '').trim();
              if (content) {
                const remoteTips = JSON.parse(localStorage.getItem('mori_remote_tips') || '[]');
                if (!remoteTips.some(t => t.id === `remote-tip-${update.message.message_id}`)) {
                  const newTip = {
                    id: `remote-tip-${update.message.message_id}`,
                    text: content,
                    title: "نصيحة إضافية من خالد",
                    created_at: Date.now(),
                  };
                  remoteTips.push({ ...newTip, isRemote: true });
                  localStorage.setItem('mori_remote_tips', JSON.stringify(remoteTips));
                  
                  // Sync to Supabase
                  await supabase.from('remote_tips').upsert(newTip);
                  
                  listenersRef.current.onReply.forEach(cb => cb("💡 تمت إضافة نصيحة جديدة للموقع"));
                }
              }
              continue;
            }

            // Undo Message (by index)
            if (text.match(/^[/\\]undo_msg\s+\d+/i)) {
              const num = parseInt(text.replace(/^[/\\]undo_msg\s+/i, '').trim(), 10);
              const remoteMsgs = JSON.parse(localStorage.getItem('mori_remote_messages') || '[]');
              if (num > 0 && num <= remoteMsgs.length) {
                const msgToDelete = remoteMsgs[num - 1]; // 1-based index
                const newMsgs = remoteMsgs.filter((_, idx) => idx !== num - 1);
                localStorage.setItem('mori_remote_messages', JSON.stringify(newMsgs));
                await supabase.from('remote_messages').delete().eq('id', msgToDelete.id);
                // Also trigger storage event in same window context if needed
                window.dispatchEvent(new Event('storage'));
                listenersRef.current.onReply.forEach(cb => cb(`✅ تم مسح الرسالة السريعة رقم ${num}`));
              } else {
                listenersRef.current.onReply.forEach(cb => cb(`❌ لا توجد رسالة السريعة برقم ${num}`));
              }
              continue;
            }

            // Undo Tip (by index)
            if (text.match(/^[/\\]undo_tip\s+\d+/i)) {
              const num = parseInt(text.replace(/^[/\\]undo_tip\s+/i, '').trim(), 10);
              const remoteTips = JSON.parse(localStorage.getItem('mori_remote_tips') || '[]');
              if (num > 0 && num <= remoteTips.length) {
                const tipToDelete = remoteTips[num - 1]; // 1-based index
                const newTips = remoteTips.filter((_, idx) => idx !== num - 1);
                localStorage.setItem('mori_remote_tips', JSON.stringify(newTips));
                await supabase.from('remote_tips').delete().eq('id', tipToDelete.id);
                window.dispatchEvent(new Event('storage'));
                listenersRef.current.onReply.forEach(cb => cb(`✅ تم مسح النصيحة رقم ${num}`));
              } else {
                listenersRef.current.onReply.forEach(cb => cb(`❌ لا توجد نصيحة برقم ${num}`));
              }
              continue;
            }

            // Clear Live Notes
            if (text.match(/^[/\\]clear_notes/i)) {
                localStorage.removeItem('mori_live_notes_stack');
                // The new system will use 'live_note' on Supabase
                await supabase.from('live_note').delete().neq('id', -1);
                window.dispatchEvent(new Event('storage'));
                listenersRef.current.onReply.forEach(cb => cb(`✅ تم مسح جميع حالات المباشرة (الستوريز)`));
                continue;
            }

            // Garden Water
            if (text.match(/^[/\\]water$/i)) {
              const points = parseFloat(localStorage.getItem('mori_garden_points') || '0');
              localStorage.setItem('mori_garden_points', (points + 5).toString());
              window.dispatchEvent(new Event('storage'));
              listenersRef.current.onReply.forEach(cb => cb("💧 موري: خالد سقى الزرعة ليكي ونقاطها زادت! ✨"));
              continue;
            }

            let noteObj = null;
            const caption = update.message.caption || "";
            const isImageCmd = caption.match(/^[/\\]img/i);
            const isVideoCmd = caption.match(/^[/\\]vid/i);
            
            if (update.message.photo && isImageCmd) {
              const photo = update.message.photo[update.message.photo.length - 1];
              const url = await getTelegramFileUrl(photo.file_id);
              if (url) noteObj = { id: update.message.message_id, type: 'image', url, text: caption.replace(/^[/\\]img\s*/i, '').trim(), timestamp: Date.now() };
            } else if (update.message.video && isVideoCmd) {
              const url = await getTelegramFileUrl(update.message.video.file_id);
              if (url) noteObj = { id: update.message.message_id, type: 'video', url, text: caption.replace(/^[/\\]vid\s*/i, '').trim(), timestamp: Date.now() };
            } else if (update.message.video_note) {
              // Video notes cannot have captions in normal Telegram UI, so they remain inherently allowed.
              const url = await getTelegramFileUrl(update.message.video_note.file_id);
              if (url) noteObj = { id: update.message.message_id, type: 'video_note', url, text: "", timestamp: Date.now() };
            } else if (text && text.match(/^[/\\]note\s+/i)) {
              const noteContent = text.replace(/^[/\\]note\s+/i, '').trim();
              if (noteContent) noteObj = { id: update.message.message_id, type: 'text', text: noteContent, timestamp: Date.now() };
            }

            if (noteObj) {
              const liveNotes = JSON.parse(localStorage.getItem('mori_live_notes_stack') || '[]');
              if (!liveNotes.some(n => n.id === noteObj.id)) {
                 liveNotes.push(noteObj);
                 localStorage.setItem('mori_live_notes_stack', JSON.stringify(liveNotes));
                 // Sync to Supabase as distinct records
                 await supabase.from('live_note').upsert({ id: noteObj.id, data: noteObj, timestamp: Date.now() });
                 
                 listenersRef.current.onNote.forEach(cb => cb(noteObj));
              }
            }
          }
        }
        
        localStorage.setItem('mori_last_update_id', maxId.toString());
        setLastUpdateId(maxId);
      }
    } catch (e) {
      console.error("Polling error:", e);
      return "error";
    } finally {
      isPollingRef.current = false;
    }
    return "ok";
  }, []);

  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    const recursivePoll = async () => {
      if (!isMounted) return;
      const result = await poll();
      if (!isMounted) return;

      // Dynamic delay: 10s if conflict/error, 2s if ok
      const delay = (result === "conflict" || result === "error") ? 10000 : 2000;
      timeoutId = setTimeout(recursivePoll, delay);
    };

    recursivePoll();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [poll]);

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
