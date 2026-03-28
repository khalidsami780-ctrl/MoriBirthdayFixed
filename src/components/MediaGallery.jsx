import { useState } from 'react'
import { motion } from 'framer-motion'
import FullscreenViewer from './FullscreenViewer'
import { Cloudinary } from '@cloudinary/url-gen'
import { AdvancedImage, AdvancedVideo, placeholder } from '@cloudinary/react'
import { format, quality } from '@cloudinary/url-gen/actions/delivery'

const cld = new Cloudinary({ cloud: { cloudName: 'djdktudjh' } })

// Parse securely and handle Arabic URL encoded characters
const extractCloudinaryId = (url) => {
  const match = url?.match(/\/upload\/(?:v\d+\/)?([^.]+)/)
  if (!match) return ''
  try {
    return decodeURIComponent(match[1])
  } catch (e) {
    return match[1]
  }
}

// Reusable Preview Thumbnail
function PreviewItem({ item }) {
  if (item.type === 'link') {
    return (
      <div style={S.linkPreview}>
        <span style={S.icon}>🔗</span>
        <span style={S.linkText}>Link Attached</span>
      </div>
    )
  }

  if (item.type === 'audio') {
    return (
      <div style={S.audioPreview}>
        <span style={S.icon}>🎵</span>
        <span style={S.linkText}>Audio Attached</span>
      </div>
    )
  }

  const publicId = extractCloudinaryId(item.url)
  if (!publicId) return null

  const mediaAsset = item.type === 'video' ? cld.video(publicId) : cld.image(publicId)
  mediaAsset.delivery(format('auto')).delivery(quality('auto'))

  return (
    <>
      {item.type === 'video' ? (
        <AdvancedVideo cldVid={mediaAsset} muted loop playsInline autoPlay style={S.previewMedia} />
      ) : (
        <AdvancedImage cldImg={mediaAsset} plugins={[placeholder({ mode: 'blur' })]} style={S.previewMedia} />
      )}
      {item.type === 'video' && (
        <div style={S.playOverlay}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}
    </>
  )
}

export default function MediaGallery({ attachments = [] }) {
  const [viewerIndex, setViewerIndex] = useState(-1)

  if (!attachments || attachments.length === 0) return null

  const renderGrid = () => {
    // Single item - render beautifully full-width
    if (attachments.length === 1) {
      return (
        <motion.div 
          style={S.singleWrap} 
          onClick={() => setViewerIndex(0)}
          whileHover={{ scale: 1.02, boxShadow: '0 12px 30px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(168,200,248,0.25)' }}
          whileTap={{ scale: 0.98 }}
        >
          <PreviewItem item={attachments[0]} />
        </motion.div>
      )
    }

    // Grid System
    return (
      <div style={S.gridWrap}>
        {attachments.slice(0, 2).map((item, index) => {
          const isSecondElement = index === 1
          const hasMore = attachments.length > 2

          return (
            <motion.div 
              key={index} 
              style={S.gridItem} 
              onClick={() => setViewerIndex(index)}
              whileHover={{ scale: 1.03, zIndex: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.7)' }}
              whileTap={{ scale: 0.97 }}
            >
              <PreviewItem item={item} />
              
              {/* Overlay Badge for remaining items */}
              {isSecondElement && hasMore && (
                <div style={S.moreOverlay}>
                  <span style={S.moreText}>+{attachments.length - 2}</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={S.galleryContainer}>
      {renderGrid()}
      
      {viewerIndex !== -1 && (
        <FullscreenViewer 
          mediaItems={attachments} 
          initialIndex={viewerIndex} 
          onClose={() => setViewerIndex(-1)} 
        />
      )}
    </div>
  )
}

const S = {
  galleryContainer: {
    marginTop: '0.75rem', width: '100%', flexShrink: 0, display: 'block'
  },
  singleWrap: {
    borderRadius: '16px', overflow: 'hidden', 
    height: '210px', minHeight: '210px', maxHeight: '210px', 
    width: '100%',
    cursor: 'pointer', position: 'relative', background: '#02060f',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(91,156,246,0.15)',
    transform: 'translateZ(0)', display: 'block' 
  },
  gridWrap: {
    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px',
    width: '100%', flexShrink: 0
  },
  gridItem: {
    borderRadius: '12px', overflow: 'hidden', 
    height: '180px', minHeight: '180px', maxHeight: '180px', 
    width: '100%',
    cursor: 'pointer', position: 'relative', background: '#02060f',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(91,156,246,0.15)',
    transform: 'translateZ(0)', display: 'block'
  },
  previewMedia: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block', flexShrink: 0
  },
  playOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
  },
  linkPreview: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'rgba(26, 74, 138, 0.15)'
  },
  audioPreview: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'rgba(180, 100, 150, 0.15)'
  },
  icon: { fontSize: '2.5rem', marginBottom: '0.6rem' },
  linkText: { color: 'var(--blue-200)', fontSize: '0.9rem', fontWeight: 'bold' },
  moreOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(2, 6, 15, 0.75)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  moreText: {
    color: '#fff', fontSize: '2rem', fontWeight: 'bold', fontFamily: 'system-ui, sans-serif'
  }
}
