import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useSupabaseSync
 * A one-time migration hook to move old localStorage data to Supabase cloud.
 */
export function useSupabaseSync() {
  useEffect(() => {
    const migrateData = async () => {
      // Check if already migrated on this device
      if (localStorage.getItem('mori_supabase_migrated') === 'true') return;

      console.log("Supabase Sync: Starting one-time migration...");

      try {
        // 1. Sync Reasons Jar
        const localReasons = JSON.parse(localStorage.getItem('mori_reasons_jar') || '[]');
        if (localReasons.length > 0) {
          const formattedReasons = localReasons.map(r => ({
            id: r.id,
            text: r.text,
            timestamp: r.timestamp,
            archived: r.archived || false
          }));
          await supabase.from('reasons_jar').upsert(formattedReasons);
        }

        // 2. Sync Remote Messages
        const localMsgs = JSON.parse(localStorage.getItem('mori_remote_messages') || '[]');
        if (localMsgs.length > 0) {
          const formattedMsgs = localMsgs.map(m => ({
            id: m.id,
            title: m.title,
            text: m.text,
            media: m.media || [],
            created_at: m.createdAt || m.created_at || Date.now()
          }));
          await supabase.from('remote_messages').upsert(formattedMsgs);
        }

        // 3. Sync Remote Tips
        const localTips = JSON.parse(localStorage.getItem('mori_remote_tips') || '[]');
        if (localTips.length > 0) {
          const formattedTips = localTips.map(t => ({
            id: t.id,
            title: t.title,
            text: t.text,
            created_at: t.createdAt || t.created_at || Date.now()
          }));
          await supabase.from('remote_tips').upsert(formattedTips);
        }

        // 4. Sync Live Note
        const localNote = localStorage.getItem('mori_live_note');
        if (localNote) {
           const parsedNote = JSON.parse(localNote);
           await supabase.from('live_note').upsert({ 
             id: 1, 
             data: parsedNote, 
             timestamp: parsedNote.timestamp || Date.now() 
           });
        }

        // Mark as migrated
        localStorage.setItem('mori_supabase_migrated', 'true');
        console.log("Supabase Sync: Migration completed successfully! ✨");
      } catch (e) {
        console.error("Supabase Sync: Migration failed", e);
      }
    };

    migrateData();
  }, []);
}
