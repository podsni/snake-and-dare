export function Avatar({ id, label }: { id: string; label?: string }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-label={label ?? id}>
      {face(id)}
    </svg>
  )
}

function face(id: string) {
  switch (id) {
    case 'rabbit':
      return (
        <>
          <ellipse cx="22" cy="16" rx="7" ry="14" fill="#F8D7E3" stroke="#2B2144" strokeWidth="2" />
          <ellipse cx="42" cy="16" rx="7" ry="14" fill="#F8D7E3" stroke="#2B2144" strokeWidth="2" />
          <ellipse cx="22" cy="16" rx="3" ry="8" fill="#FF8FB8" />
          <ellipse cx="42" cy="16" rx="3" ry="8" fill="#FF8FB8" />
          <circle cx="32" cy="38" r="18" fill="#FFF6FB" stroke="#2B2144" strokeWidth="2.5" />
          <Eyes y={36} />
          <ellipse cx="32" cy="44" rx="3" ry="2" fill="#FF8FB8" />
        </>
      )
    case 'panda':
      return (
        <>
          <circle cx="16" cy="18" r="8" fill="#2B2144" />
          <circle cx="48" cy="18" r="8" fill="#2B2144" />
          <circle cx="32" cy="36" r="20" fill="#fff" stroke="#2B2144" strokeWidth="2.5" />
          <ellipse cx="23" cy="36" rx="7" ry="8" fill="#2B2144" />
          <ellipse cx="41" cy="36" rx="7" ry="8" fill="#2B2144" />
          <circle cx="23" cy="36" r="2.4" fill="#fff" />
          <circle cx="41" cy="36" r="2.4" fill="#fff" />
          <ellipse cx="32" cy="44" rx="3" ry="2" fill="#2B2144" />
        </>
      )
    case 'fox':
      return (
        <>
          <path d="M10 26 L22 8 L28 24 Z" fill="#FF922B" stroke="#2B2144" strokeWidth="2" />
          <path d="M54 26 L42 8 L36 24 Z" fill="#FF922B" stroke="#2B2144" strokeWidth="2" />
          <circle cx="32" cy="38" r="18" fill="#FF922B" stroke="#2B2144" strokeWidth="2.5" />
          <path d="M20 46 Q32 58 44 46 Q32 50 20 46" fill="#fff" />
          <Eyes y={36} />
          <circle cx="32" cy="43" r="2.2" fill="#2B2144" />
        </>
      )
    case 'bear':
      return (
        <>
          <circle cx="16" cy="20" r="8" fill="#C47A3A" stroke="#2B2144" strokeWidth="2" />
          <circle cx="48" cy="20" r="8" fill="#C47A3A" stroke="#2B2144" strokeWidth="2" />
          <circle cx="32" cy="38" r="19" fill="#E8A15A" stroke="#2B2144" strokeWidth="2.5" />
          <ellipse cx="32" cy="44" rx="8" ry="6" fill="#F3D2A4" />
          <Eyes y={34} />
          <circle cx="32" cy="42" r="2.4" fill="#2B2144" />
        </>
      )
    case 'robot':
      return (
        <>
          <rect x="30" y="6" width="4" height="10" rx="2" fill="#4DABF7" stroke="#2B2144" strokeWidth="2" />
          <circle cx="32" cy="6" r="3" fill="#FFD43B" stroke="#2B2144" strokeWidth="2" />
          <rect x="12" y="18" width="40" height="34" rx="10" fill="#D0EBFF" stroke="#2B2144" strokeWidth="2.5" />
          <rect x="20" y="28" width="8" height="8" rx="2" fill="#2B2144" />
          <rect x="36" y="28" width="8" height="8" rx="2" fill="#2B2144" />
          <rect x="22" y="42" width="20" height="4" rx="2" fill="#7950F2" />
        </>
      )
    case 'dino':
      return (
        <>
          <path d="M14 28 L20 12 L26 26 L32 14 L38 26 L46 16 L50 30" fill="none" stroke="#2F9E44" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="32" cy="40" r="18" fill="#69DB7C" stroke="#2B2144" strokeWidth="2.5" />
          <ellipse cx="46" cy="42" rx="8" ry="6" fill="#8CE99A" stroke="#2B2144" strokeWidth="2" />
          <Eyes y={36} />
          <path d="M24 46 Q32 50 40 46" fill="none" stroke="#2B2144" strokeWidth="2" strokeLinecap="round" />
        </>
      )
    case 'alien':
      return (
        <>
          <ellipse cx="32" cy="36" rx="16" ry="20" fill="#96F2D7" stroke="#2B2144" strokeWidth="2.5" />
          <line x1="24" y1="16" x2="18" y2="6" stroke="#2B2144" strokeWidth="2" />
          <line x1="40" y1="16" x2="46" y2="6" stroke="#2B2144" strokeWidth="2" />
          <circle cx="18" cy="6" r="3" fill="#FFD43B" stroke="#2B2144" strokeWidth="2" />
          <circle cx="46" cy="6" r="3" fill="#FFD43B" stroke="#2B2144" strokeWidth="2" />
          <ellipse cx="26" cy="36" rx="5" ry="7" fill="#2B2144" />
          <ellipse cx="38" cy="36" rx="5" ry="7" fill="#2B2144" />
          <circle cx="27" cy="34" r="1.6" fill="#fff" />
          <circle cx="39" cy="34" r="1.6" fill="#fff" />
          <path d="M27 46 Q32 49 37 46" fill="none" stroke="#2B2144" strokeWidth="2" strokeLinecap="round" />
        </>
      )
    case 'owl':
      return (
        <>
          <path d="M16 22 L22 10 L28 22" fill="#C47A3A" stroke="#2B2144" strokeWidth="2" />
          <path d="M36 22 L42 10 L48 22" fill="#C47A3A" stroke="#2B2144" strokeWidth="2" />
          <ellipse cx="32" cy="38" rx="20" ry="18" fill="#E8A15A" stroke="#2B2144" strokeWidth="2.5" />
          <circle cx="24" cy="36" r="7" fill="#fff" stroke="#2B2144" strokeWidth="2" />
          <circle cx="40" cy="36" r="7" fill="#fff" stroke="#2B2144" strokeWidth="2" />
          <circle cx="24" cy="36" r="3" fill="#2B2144" />
          <circle cx="40" cy="36" r="3" fill="#2B2144" />
          <path d="M32 40 L28 46 H36 Z" fill="#FFD43B" stroke="#2B2144" strokeWidth="2" />
        </>
      )
    case 'frog':
      return (
        <>
          <circle cx="20" cy="22" r="8" fill="#69DB7C" stroke="#2B2144" strokeWidth="2.5" />
          <circle cx="44" cy="22" r="8" fill="#69DB7C" stroke="#2B2144" strokeWidth="2.5" />
          <circle cx="20" cy="22" r="3" fill="#2B2144" />
          <circle cx="44" cy="22" r="3" fill="#2B2144" />
          <ellipse cx="32" cy="40" rx="18" ry="14" fill="#8CE99A" stroke="#2B2144" strokeWidth="2.5" />
          <path d="M22 44 Q32 52 42 44" fill="none" stroke="#2B2144" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="28" cy="40" r="1.5" fill="#FF5C9D" />
          <circle cx="36" cy="40" r="1.5" fill="#FF5C9D" />
        </>
      )
    default:
      return (
        <>
          <path d="M14 30 L22 12 L30 28" fill="#FFB703" stroke="#2B2144" strokeWidth="2" />
          <path d="M34 28 L42 12 L50 30" fill="#FFB703" stroke="#2B2144" strokeWidth="2" />
          <circle cx="32" cy="38" r="18" fill="#FFD43B" stroke="#2B2144" strokeWidth="2.5" />
          <Eyes y={36} />
          <path d="M26 44 Q32 50 38 44" fill="none" stroke="#2B2144" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="40" x2="18" y2="42" stroke="#2B2144" strokeWidth="1.6" />
          <line x1="8" y1="46" x2="18" y2="45" stroke="#2B2144" strokeWidth="1.6" />
          <line x1="46" y1="42" x2="56" y2="40" stroke="#2B2144" strokeWidth="1.6" />
          <line x1="46" y1="45" x2="56" y2="46" stroke="#2B2144" strokeWidth="1.6" />
        </>
      )
  }
}

function Eyes({ y }: { y: number }) {
  return (
    <>
      <circle cx="25" cy={y} r="2.6" fill="#2B2144" />
      <circle cx="39" cy={y} r="2.6" fill="#2B2144" />
      <circle cx="26" cy={y - 1} r="0.8" fill="#fff" />
      <circle cx="40" cy={y - 1} r="0.8" fill="#fff" />
    </>
  )
}
