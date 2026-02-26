import { useMemo } from 'react'

export default function Stars({ count = 60 }) {
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      top:  `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      dur:  `${2.5 + Math.random() * 4}s`,
      delay: `${Math.random() * 4}s`,
      size: Math.random() > 0.85 ? '3px' : Math.random() > 0.5 ? '2px' : '1.5px',
    }))
  }, [count])

  return (
    <div className="stars" aria-hidden="true">
      {stars.map(s => (
        <span
          key={s.id}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            '--dur': s.dur,
            '--delay': s.delay,
          }}
        />
      ))}
    </div>
  )
}
