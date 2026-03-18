import { useMemo } from 'react'

export default function Stars({ count = 65 }) {
  const stars = useMemo(() => Array.from({ length: count }, (_, i) => {
    const large = Math.random() > 0.88
    const med   = !large && Math.random() > 0.55
    return {
      id: i,
      top:   `${Math.random() * 100}%`,
      left:  `${Math.random() * 100}%`,
      size:  large ? '3px' : med ? '2px' : '1.5px',
      dur:   `${2.8 + Math.random() * 5}s`,
      delay: `${Math.random() * 5}s`,
      // Large stars get a subtle glow
      glow:  large,
    }
  }), [count])

  return (
    <div className="stars" aria-hidden="true">
      {stars.map(s => (
        <span
          key={s.id}
          className="star"
          style={{
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            '--dur':   s.dur,
            '--delay': s.delay,
            boxShadow: s.glow ? '0 0 3px 1px rgba(255,255,255,0.35)' : 'none',
          }}
        />
      ))}
    </div>
  )
}
