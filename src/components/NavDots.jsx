const SECTIONS = [
  'pdf-gift', 'welcome', 'birthday', 'message',
  'poetry',   'koko',    'dua',      'music', 'gift'
]

export default function NavDots({ active, scrollTo }) {
  return (
    <nav className="nav-dots" aria-label="Section navigation">
      {SECTIONS.map((id, i) => (
        <button
          key={id}
          className={[
            'nav-dot',
            active === i      ? 'active'         : '',
            id === 'music'    ? 'nav-dot--music' : '',
            id === 'gift'     ? 'nav-dot--gift'  : '',
            id === 'pdf-gift' ? 'nav-dot--pdf'   : '',
          ].filter(Boolean).join(' ')}
          onClick={() => scrollTo(i)}
          aria-label={`Go to ${id}`}
          title={id.charAt(0).toUpperCase() + id.slice(1)}
        />
      ))}
    </nav>
  )
}