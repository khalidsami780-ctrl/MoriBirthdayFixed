import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TelegramContext } from './TelegramContextCore.jsx';
import { moodDatabase } from '../data/moodMessages.js';
import { supabase } from '../lib/supabase.js';
import { useTelegramBot } from '../hooks/useTelegramBot.js';

const TELEGRAM_TOKEN   = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  throw new Error("Missing Telegram environment variables (VITE_TELEGRAM_BOT_TOKEN or VITE_TELEGRAM_CHAT_ID)");
}

// ─── Polling delay config ────────────────────────────────────────────────────
const POLL_OK_DELAY       = 2_000;   // 2s when healthy
const POLL_ERROR_DELAY    = 10_000;  // 10s on error
const POLL_CONFLICT_STEPS = [10_000, 30_000, 60_000]; // exponential backoff on 409

// ─────────────────────────────────────────────────────────────────────────────

export function TelegramProvider({ children }) {
  const [lastUpdateId, setLastUpdateId] = useState(
    () => parseInt(localStorage.getItem('mori_last_update_id') || '0', 10)
  );

  const isPollingRef    = useRef(false);
  const conflictCount   = useRef(0);   // tracks consecutive 409s for backoff

  const listenersRef = useRef({
    onReply: new Set(),
    onNote:  new Set(),
    onPulse: new Set(),
  });

  // ── Helper: get Telegram file URL ────────────────────────────────────────

  const getTelegramFileUrl = useCallback(async (file_id) => {
    try {
      const res  = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${file_id}`);
      const data = await res.json();
      if (data.ok) return `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${data.result.file_path}`;
    } catch (e) {
      console.error('getTelegramFileUrl failed', e);
    }
    return null;
  }, []);

  // ── Helper: send a message (used internally for confirmations) ────────────

  const _sendMsg = useCallback(async (text) => {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
      });
    } catch { /* internal helper — silent fail */ }
  }, []);

  // ── Core Poll Function ────────────────────────────────────────────────────

  const poll = useCallback(async () => {
    if (isPollingRef.current || document.visibilityState !== 'visible') return 'skip';
    isPollingRef.current = true;

    try {
      const currentLastId = parseInt(localStorage.getItem('mori_last_update_id') || '0', 10);
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${currentLastId + 1}&timeout=25`,
        { signal: AbortSignal.timeout(32_000) } // 32s hard timeout
      );

      // 409 Conflict: another instance is polling
      if (res.status === 409) {
        conflictCount.current += 1;
        isPollingRef.current = false;
        return 'conflict';
      }

      // Reset conflict counter on any non-409 response
      conflictCount.current = 0;

      const data = await res.json();
      if (!data.ok || data.result.length === 0) {
        isPollingRef.current = false;
        return 'ok';
      }

      let maxId = currentLastId;

      for (const update of data.result) {
        maxId = Math.max(maxId, update.update_id);
        await processUpdate(update);
      }

      localStorage.setItem('mori_last_update_id', maxId.toString());
      setLastUpdateId(maxId);

    } catch (e) {
      // AbortError is expected on timeout — treat as empty poll, not error
      if (e.name !== 'AbortError') {
        console.error('Telegram poll error:', e);
        isPollingRef.current = false;
        return 'error';
      }
    }

    isPollingRef.current = false;
    return 'ok';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update Processor ─────────────────────────────────────────────────────

  const processUpdate = useCallback(async (update) => {
    // ── Callback queries (inline keyboard buttons) ──────────────────────────
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }

    if (!update.message) return;
    if (String(update.message.chat.id) !== String(TELEGRAM_CHAT_ID)) return;

    const msg  = update.message;
    const text = msg.text?.trim() || '';

    // ── Voice note security flow ─────────────────────────────────────────
    if (msg.voice) {
      const msgId = msg.message_id;
      localStorage.setItem(`pending_vn_${msgId}`, msg.voice.file_id);
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: '🎤 تم استقبال تسجيل صوتي.. هل تريد رفعه لحالات موري المباشرة؟',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ نعم، ارفعه الآن', callback_data: `confirm_vn_${msgId}` },
              { text: '❌ إلغاء',            callback_data: `cancel_vn_${msgId}`  },
            ]],
          },
        }),
      });
      return;
    }

    // ── Commands ──────────────────────────────────────────────────────────

    // /pulse /heart /hug /status /report /withher /withyou
    const pulseMatch = text.match(/^[/\\](pulse|heart|hug|status|report|withher|withyou)$/i);
    if (pulseMatch) {
      const cmd = pulseMatch[1].toLowerCase();
      const signal = { id: msg.message_id, type: cmd, timestamp: Date.now() };
      localStorage.setItem('mori_pulse_signal', JSON.stringify(signal));
      window.dispatchEvent(new Event('storage'));
      listenersRef.current.onPulse.forEach(cb => cb(signal));
      return;
    }

    // /reason [text]
    if (text.match(/^[/\\]reason\s+/i)) {
      const reason = text.replace(/^[/\\]reason\s+/i, '').trim();
      if (reason) {
        const jar = JSON.parse(localStorage.getItem('mori_reasons_jar') || '[]');
        if (!jar.some(item => item.id === msg.message_id)) {
          const newReason = { id: msg.message_id, text: reason, timestamp: Date.now(), archived: false };
          jar.push(newReason);
          localStorage.setItem('mori_reasons_jar', JSON.stringify(jar));
          await supabase.from('reasons_jar').upsert(newReason);
        }
      }
      return;
    }

    // /msg [title]|[content]
    if (text.match(/^[/\\]msg(\s+|\n+)/i)) {
      const contentWithTitle = text.replace(/^[/\\]msg(\s+|\n+)/i, '').trim();
      const parts   = contentWithTitle.split('|');
      const title   = parts[0]?.trim() || 'رسالة من قلب خالد';
      const content = parts[1]?.trim() || (parts.length === 1 ? parts[0]?.trim() : '');

      if (content || msg.photo) {
        const remoteMsgs = JSON.parse(localStorage.getItem('mori_remote_messages') || '[]');
        if (!remoteMsgs.some(m => m.id === `remote-${msg.message_id}`)) {
          let media = [];
          if (msg.photo) {
            const photo = msg.photo[msg.photo.length - 1];
            const url = await getTelegramFileUrl(photo.file_id);
            if (url) media.push({ url, type: 'image' });
          }
          const newMsg = { id: `remote-${msg.message_id}`, title, text: content, media, created_at: Date.now() };
          remoteMsgs.push({ ...newMsg, isRemote: true });
          localStorage.setItem('mori_remote_messages', JSON.stringify(remoteMsgs));
          await supabase.from('remote_messages').upsert(newMsg);
          listenersRef.current.onReply.forEach(cb => cb('✨ تمت إضافة رسالة دائمة للموقع'));
        }
      }
      return;
    }

    // /tip [text]
    if (text.match(/^[/\\]tip\s+/i)) {
      const content = text.replace(/^[/\\]tip\s+/i, '').trim();
      if (content) {
        const remoteTips = JSON.parse(localStorage.getItem('mori_remote_tips') || '[]');
        if (!remoteTips.some(t => t.id === `remote-tip-${msg.message_id}`)) {
          const newTip = { id: `remote-tip-${msg.message_id}`, text: content, title: 'نصيحة إضافية من خالد', created_at: Date.now() };
          remoteTips.push({ ...newTip, isRemote: true });
          localStorage.setItem('mori_remote_tips', JSON.stringify(remoteTips));
          await supabase.from('remote_tips').upsert(newTip);
          listenersRef.current.onReply.forEach(cb => cb('💡 تمت إضافة نصيحة جديدة للموقع'));
        }
      }
      return;
    }

    // /undo_msg [n]
    if (text.match(/^[/\\]undo_msg\s+\d+/i)) {
      const num = parseInt(text.replace(/^[/\\]undo_msg\s+/i, '').trim(), 10);
      const msgs = JSON.parse(localStorage.getItem('mori_remote_messages') || '[]');
      if (num > 0 && num <= msgs.length) {
        const target  = msgs[num - 1];
        const updated = msgs.filter((_, i) => i !== num - 1);
        localStorage.setItem('mori_remote_messages', JSON.stringify(updated));
        await supabase.from('remote_messages').delete().eq('id', target.id);
        window.dispatchEvent(new Event('storage'));
        listenersRef.current.onReply.forEach(cb => cb(`✅ تم مسح الرسالة السريعة رقم ${num}`));
      } else {
        listenersRef.current.onReply.forEach(cb => cb(`❌ لا توجد رسالة برقم ${num}`));
      }
      return;
    }

    // /undo_tip [n]
    if (text.match(/^[/\\]undo_tip\s+\d+/i)) {
      const num = parseInt(text.replace(/^[/\\]undo_tip\s+/i, '').trim(), 10);
      const tips = JSON.parse(localStorage.getItem('mori_remote_tips') || '[]');
      if (num > 0 && num <= tips.length) {
        const target  = tips[num - 1];
        const updated = tips.filter((_, i) => i !== num - 1);
        localStorage.setItem('mori_remote_tips', JSON.stringify(updated));
        await supabase.from('remote_tips').delete().eq('id', target.id);
        window.dispatchEvent(new Event('storage'));
        listenersRef.current.onReply.forEach(cb => cb(`✅ تم مسح النصيحة رقم ${num}`));
      } else {
        listenersRef.current.onReply.forEach(cb => cb(`❌ لا توجد نصيحة برقم ${num}`));
      }
      return;
    }

    // /clear_notes
    if (text.match(/^[/\\]clear_notes/i)) {
      localStorage.removeItem('mori_live_notes_stack');
      await supabase.from('live_note').delete().neq('id', -1);
      window.dispatchEvent(new Event('storage'));
      listenersRef.current.onReply.forEach(cb => cb('✅ تم مسح جميع حالات المباشرة'));
      return;
    }

    // /water
    if (text.match(/^[/\\]water$/i)) {
      const points = parseFloat(localStorage.getItem('mori_garden_points') || '0');
      localStorage.setItem('mori_garden_points', (points + 5).toString());
      window.dispatchEvent(new Event('storage'));
      listenersRef.current.onReply.forEach(cb => cb('💧 موري: خالد سقى الزرعة ليكي ونقاطها زادت! ✨'));
      return;
    }

    // Media commands (/img, /vid, video_note) + /note
    let noteObj = null;
    const caption    = msg.caption || '';
    const isImageCmd = caption.match(/^[/\\]img/i);
    const isVideoCmd = caption.match(/^[/\\]vid/i);

    if (msg.photo && isImageCmd) {
      const photo = msg.photo[msg.photo.length - 1];
      const url   = await getTelegramFileUrl(photo.file_id);
      if (url) noteObj = { id: msg.message_id, type: 'image', url, text: caption.replace(/^[/\\]img\s*/i, '').trim(), timestamp: Date.now() };
    } else if (msg.video && isVideoCmd) {
      const url = await getTelegramFileUrl(msg.video.file_id);
      if (url) noteObj = { id: msg.message_id, type: 'video', url, text: caption.replace(/^[/\\]vid\s*/i, '').trim(), timestamp: Date.now() };
    } else if (msg.video_note) {
      const url = await getTelegramFileUrl(msg.video_note.file_id);
      if (url) noteObj = { id: msg.message_id, type: 'video_note', url, text: '', timestamp: Date.now() };
    } else if (text.match(/^[/\\]note\s+/i)) {
      const content = text.replace(/^[/\\]note\s+/i, '').trim();
      if (content) noteObj = { id: msg.message_id, type: 'text', text: content, timestamp: Date.now() };
    }

    if (noteObj) {
      const liveNotes = JSON.parse(localStorage.getItem('mori_live_notes_stack') || '[]');
      if (!liveNotes.some(n => n.id === noteObj.id)) {
        liveNotes.push(noteObj);
        localStorage.setItem('mori_live_notes_stack', JSON.stringify(liveNotes));
        await supabase.from('live_note').upsert({ id: noteObj.id, data: noteObj, timestamp: Date.now() });
        listenersRef.current.onNote.forEach(cb => cb(noteObj));
      }
    }
  }, [getTelegramFileUrl]);

  // ── Callback Query Handler ────────────────────────────────────────────────

  const handleCallbackQuery = useCallback(async (callbackQuery) => {
    const data   = callbackQuery.data;
    let toastText = '';

    // Standard reply buttons
    if (data === 'reply_received') toastText = '💙 خالد: وصلتني';
    if (data === 'reply_pray')     toastText = '🤲 خالد: بدعيلك';
    if (data === 'reply_ok')       toastText = '✨ خالد: أنتِ بخير';

    // Voice note confirmation
    if (data.startsWith('confirm_vn_')) {
      const msgIdStr = data.replace('confirm_vn_', '');
      const fileId   = localStorage.getItem(`pending_vn_${msgIdStr}`);
      if (fileId) {
        const url = await getTelegramFileUrl(fileId);
        if (url) {
          const noteId  = parseInt(msgIdStr, 10);
          const noteObj = { id: noteId, type: 'voice', url, text: 'رسالة صوتية من خالد 🎤', timestamp: Date.now() };
          const liveNotes = JSON.parse(localStorage.getItem('mori_live_notes_stack') || '[]');
          liveNotes.push(noteObj);
          localStorage.setItem('mori_live_notes_stack', JSON.stringify(liveNotes));
          await supabase.from('live_note').upsert({ id: noteId, data: noteObj, timestamp: Date.now() });
          listenersRef.current.onNote.forEach(cb => cb(noteObj));
          localStorage.removeItem(`pending_vn_${msgIdStr}`);
          await _sendMsg('✅ تم رفع التسجيل الصوتي لموري بنجاح! ✨');
        }
      } else {
        await _sendMsg('⚠️ انتهت صلاحية طلب الرفع. برجاء إعادة إرسال الفويس نوت.');
      }
    }

    if (data.startsWith('cancel_vn_')) {
      const msgId = data.replace('cancel_vn_', '');
      localStorage.removeItem(`pending_vn_${msgId}`);
      await _sendMsg('❌ تم إلغاء رفع التسجيل الصوتي.');
    }

    if (toastText) {
      listenersRef.current.onReply.forEach(cb => cb(toastText));
    }

    // Always acknowledge callback queries to dismiss the loading state in Telegram
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQuery.id }),
    });
  }, [getTelegramFileUrl, _sendMsg]);

  // ── Recursive Poll Loop ───────────────────────────────────────────────────
  // Uses exponential backoff on 409 conflicts:
  // 1st conflict → 10s, 2nd → 30s, 3rd+ → 60s
  // This ensures two open tabs settle instead of fighting forever.

  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    const loop = async () => {
      if (!isMounted) return;
      const result = await poll();
      if (!isMounted) return;

      let delay = POLL_OK_DELAY;
      if (result === 'error') {
        delay = POLL_ERROR_DELAY;
      } else if (result === 'conflict') {
        const step = Math.min(conflictCount.current - 1, POLL_CONFLICT_STEPS.length - 1);
        delay = POLL_CONFLICT_STEPS[step];
      }

      timeoutId = setTimeout(loop, delay);
    };

    loop();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [poll]);

  // ── Subscribe API ─────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────

  const botApi = useTelegramBot({ subscribe, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID });

  const value = useMemo(() => ({
    subscribe,
    TELEGRAM_TOKEN,
    TELEGRAM_CHAT_ID,
    getTelegramFileUrl,
    ...botApi
  }), [subscribe, getTelegramFileUrl, botApi]);

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}