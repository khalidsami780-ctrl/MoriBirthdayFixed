import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SafeBoxInput Premium Redesign
 * A direct emotional channel for Mori and Khalid.
 * Features: Neon pill design, Autogrow text, Independent media locks.
 */
export default function SafeBoxInput({ 
  onSend, 
  onMediaSend,
  onVoiceSend,
  locks = { text: false, voice: false, media: false },
  placeholder = "اكتبي حاجة لخالد من قلبك..." 
}) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]); // { id, file, type, preview }
  const [isFocused, setIsFocused] = useState(false);
  
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const textareaRef = useRef(null);

  // --- Auto-expand textarea logic ---
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const startRecording = async () => {
    if (locks.voice) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg', 'audio/wav']
        .find(type => MediaRecorder.isTypeSupported(type));
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        onVoiceSend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied or error", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = (e) => {
    if (locks.media) return;
    const files = Array.from(e.target.files);
    const newMedia = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: file.type.startsWith('image/') ? 'photo' : file.type.startsWith('video/') ? 'video' : 'document',
      preview: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : null
    }));
    setMediaFiles(prev => [...prev, ...newMedia]);
  };

  const removeMedia = (id) => {
    setMediaFiles(prev => {
        const item = prev.find(m => m.id === id);
        if (item?.preview) URL.revokeObjectURL(item.preview);
        return prev.filter(m => m.id !== id);
    });
  };

  const handleSend = () => {
    if (text.trim() && !locks.text) {
      onSend(text);
      setText('');
    }
    if (mediaFiles.length > 0 && !locks.media) {
      mediaFiles.forEach(item => onMediaSend(item.type, item.file));
      setMediaFiles([]);
    }
  };

  return (
    <div style={S.wrapper}>
      {/* Media Preview Tray */}
      <AnimatePresence>
        {mediaFiles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            style={S.previewTray}
          >
            {mediaFiles.map((item) => (
              <motion.div 
                key={item.id} 
                layout
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                style={S.previewItem}
              >
                {item.type === 'photo' ? (
                  <img src={item.preview} style={S.previewImg} alt="preview" />
                ) : item.type === 'video' ? (
                  <video src={item.preview} style={S.previewImg} />
                ) : (
                  <div style={S.docPreview}>📄</div>
                )}
                <button style={S.removeBtn} onClick={() => removeMedia(item.id)}>✕</button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW PREMIUM NEON PILL */}
      <motion.div 
        style={{
          ...S.pill,
          borderColor: isFocused ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
        }}
        animate={{
            boxShadow: isFocused 
              ? [
                  '0 0 25px rgba(91, 156, 246, 0.4), 0 0 25px rgba(236, 72, 153, 0.4)',
                  '0 0 45px rgba(91, 156, 246, 0.6), 0 0 45px rgba(236, 72, 153, 0.6)',
                  '0 0 25px rgba(91, 156, 246, 0.4), 0 0 25px rgba(236, 72, 153, 0.4)'
                ]
              : '0 15px 45px rgba(0,0,0,0.7)',
        }}
        transition={{ repeat: isFocused ? Infinity : 0, duration: 2 }}
      >
        {/* Animated Inner Gradients for True Neon Look */}
        <div style={S.neonGlowBlue} />
        <div style={S.neonGlowPink} />

        {/* Layout: Heart(Left) -> Text -> Clip -> Mic -> Send(Right) */}
        <motion.div 
          style={S.heartWrapper}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          💙
        </motion.div>

        <textarea
          ref={textareaRef}
          style={S.input}
          placeholder={locks.text ? "🔒 في وضع الاستراحة..." : placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={locks.text || isRecording}
          rows={1}
        />

        <div style={S.actionGroup}>
          <div style={S.iconBox}>
            <motion.button
              whileHover={{ scale: 1.3, rotate: -15 }}
              whileTap={{ scale: 0.9 }}
              style={{...S.iconBtn, opacity: locks.media ? 0.3 : 1}}
              onClick={() => fileInputRef.current.click()}
              disabled={locks.media || isRecording}
            >
              📎
            </motion.button>
            {locks.media && <div style={S.lockTip}>🔒</div>}
          </div>

          <div style={S.iconBox}>
            <motion.button
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              style={{
                ...S.iconBtn, 
                opacity: locks.voice ? 0.3 : 1,
                color: isRecording ? '#ec4899' : 'rgba(255,255,255,0.8)'
              }}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={locks.voice}
            >
              {isRecording ? '⏺️' : '🎤'}
            </motion.button>
            {locks.voice && <div style={S.lockTip}>🔒</div>}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              ...S.sendBtn,
              background: (text.trim() || mediaFiles.length > 0) ? '#fff' : 'rgba(255,255,255,0.08)',
              color: (text.trim() || mediaFiles.length > 0) ? '#0f172a' : 'rgba(255,255,255,0.2)',
            }}
            onClick={handleSend}
            disabled={(!text.trim() && mediaFiles.length === 0) || isRecording}
          >
            إرسال
          </motion.button>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} multiple accept="image/*,video/*,.pdf,.doc,.docx" />
      </motion.div>
    </div>
  );
}

const S = {
  wrapper: {
    width: 'min(98%, 700px)',
    margin: '35px auto',
    position: 'relative',
    zIndex: 100,
  },
  pill: {
    position: 'relative',
    background: 'rgba(8, 20, 45, 0.85)',
    backdropFilter: 'blur(30px) saturate(180%)',
    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
    borderRadius: '100px',
    padding: '14px 16px 14px 30px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '18px',
    border: '2px solid rgba(255, 255, 255, 0.15)',
    transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
    minHeight: '65px',
    boxShadow: '0 15px 45px rgba(0,0,0,0.7)',
  },
  neonGlowBlue: {
    position: 'absolute',
    left: '0',
    top: '0',
    bottom: '0',
    width: '40%',
    background: 'radial-gradient(circle at 0% 50%, rgba(59, 130, 246, 0.3), transparent 75%)',
    pointerEvents: 'none',
    zIndex: -1,
  },
  neonGlowPink: {
    position: 'absolute',
    right: '0',
    top: '0',
    bottom: '0',
    width: '40%',
    background: 'radial-gradient(circle at 100% 50%, rgba(236, 72, 153, 0.3), transparent 75%)',
    pointerEvents: 'none',
    zIndex: -1,
  },
  heartWrapper: {
    fontSize: '1.8rem',
    filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))',
    marginBottom: '10px',
    cursor: 'default',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: '1.35rem',
    fontFamily: "'Scheherazade New', serif",
    resize: 'none',
    padding: '10px 0',
    minHeight: '35px',
    maxHeight: '220px',
    direction: 'rtl',
    lineHeight: '1.6',
    transition: 'height 0.25s ease',
    overflowY: 'auto',
    scrollbarWidth: 'none',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '8px',
    paddingRight: '8px',
  },
  iconBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.8rem',
    cursor: 'pointer',
    opacity: 0.9,
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTip: {
    position: 'absolute',
    bottom: '-3px',
    right: '-3px',
    fontSize: '0.9rem',
    background: 'rgba(0,0,0,0.6)',
    borderRadius: '50%',
    width: '22px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    padding: '12px 32px',
    borderRadius: '100px',
    border: 'none',
    fontWeight: '900',
    fontSize: '1.2rem',
    fontFamily: "'Scheherazade New', serif",
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
  },
  previewTray: {
    display: 'flex',
    gap: '14px',
    padding: '18px 28px',
    overflowX: 'auto',
    background: 'rgba(8, 20, 45, 0.5)',
    borderRadius: '30px 30px 5px 5px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderBottom: 'none',
    marginBottom: '-5px',
    backdropFilter: 'blur(15px)',
  },
  previewItem: {
    position: 'relative',
    width: '85px',
    height: '85px',
    flexShrink: 0,
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '18px',
    border: '2px solid rgba(59, 130, 246, 0.4)',
  },
  docPreview: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '18px',
    fontSize: '2rem',
  },
  removeBtn: {
    position: 'absolute',
    top: '-7px',
    right: '-7px',
    width: '26px',
    height: '26px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    fontSize: '0.85rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  }
};
