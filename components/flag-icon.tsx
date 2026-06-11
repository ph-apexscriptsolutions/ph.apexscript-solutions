interface FlagIconProps {
  country: string
  size?: number
}

export function FlagIcon({ country, size = 18 }: FlagIconProps) {
  const commonProps = { width: size, height: Math.round(size * 0.66), viewBox: '0 0 30 20', role: 'img', 'aria-label': country }

  switch (country) {
    case 'United States':
      return (
        <svg {...commonProps} className="inline-block align-middle">
          <rect width="30" height="20" fill="#b22234" />
          <g fill="#fff">
            <rect y="0" width="30" height="1.538" />
            <rect y="3.077" width="30" height="1.538" />
            <rect y="6.154" width="30" height="1.538" />
            <rect y="9.231" width="30" height="1.538" />
            <rect y="12.308" width="30" height="1.538" />
            <rect y="15.385" width="30" height="1.538" />
            <rect y="18.462" width="30" height="1.538" />
          </g>
          <rect width="12" height="9" fill="#3c3b6e" />
          <g fill="#fff">
            <circle cx="3" cy="2.5" r="0.6" />
            <circle cx="6" cy="2.5" r="0.6" />
            <circle cx="9" cy="2.5" r="0.6" />
            <circle cx="3" cy="5" r="0.6" />
            <circle cx="6" cy="5" r="0.6" />
            <circle cx="9" cy="5" r="0.6" />
            <circle cx="3" cy="7.5" r="0.6" />
            <circle cx="6" cy="7.5" r="0.6" />
            <circle cx="9" cy="7.5" r="0.6" />
          </g>
        </svg>
      )
    case 'United Kingdom':
      return (
        <svg {...commonProps} className="inline-block align-middle">
          <rect width="30" height="20" fill="#012169" />
          <path d="M0 0 L30 20 M30 0 L0 20" stroke="#fff" strokeWidth="4" />
          <path d="M0 0 L30 20 M30 0 L0 20" stroke="#c8102e" strokeWidth="2" />
          <rect x="12" width="6" height="20" fill="#fff" />
          <rect y="7" width="30" height="6" fill="#fff" />
          <rect x="13" width="4" height="20" fill="#c8102e" />
          <rect y="8" width="30" height="4" fill="#c8102e" />
        </svg>
      )
    case 'Canada':
      return (
        <svg {...commonProps} className="inline-block align-middle">
          <rect width="30" height="20" fill="#fff" />
          <rect width="6" height="20" fill="#d52b1e" />
          <rect x="24" width="6" height="20" fill="#d52b1e" />
          <path d="M14 4 L15 6 L17 6 L15.5 8 L16.5 10 L14 9 L11.5 10 L12.5 8 L11 6 L13 6 Z" fill="#d52b1e" />
        </svg>
      )
    case 'India':
      return (
        <svg {...commonProps} className="inline-block align-middle">
          <rect width="30" height="20" fill="#ff9933" />
          <rect y="7" width="30" height="6" fill="#fff" />
          <rect y="13" width="30" height="7" fill="#138808" />
          <circle cx="15" cy="10" r="2" fill="#000080" />
          <g stroke="#000080" strokeWidth="0.3">
            <line x1="15" y1="6" x2="15" y2="14" />
            <line x1="12" y1="8" x2="18" y2="12" />
            <line x1="12" y1="12" x2="18" y2="8" />
          </g>
        </svg>
      )
    case 'Philippines':
      return (
        <svg {...commonProps} className="inline-block align-middle">
          <rect width="30" height="20" fill="#0038a8" />
          <polygon points="0,0 15,10 0,20" fill="#fff" />
          <rect y="10" width="30" height="10" fill="#ce1126" />
          <circle cx="6" cy="10" r="2" fill="#fcd116" />
          <circle cx="6" cy="10" r="1" fill="#ce1126" />
        </svg>
      )
    case 'Australia':
      return (
        <svg {...commonProps} className="inline-block align-middle">
          <rect width="30" height="20" fill="#00247d" />
          <path d="M0 0 L12 0 L0 8 Z" fill="#fff" />
          <path d="M0 0 L12 0 L0 8 Z" fill="#cc142b" transform="translate(0,0)" />
          <path d="M0 20 L12 20 L0 12 Z" fill="#fff" />
          <path d="M0 20 L12 20 L0 12 Z" fill="#cc142b" transform="translate(0,0)" />
          <polygon points="12,6 20,10 12,14 10,10" fill="#fff" />
          <circle cx="23" cy="5" r="1" fill="#fff" />
          <circle cx="25" cy="8" r="0.8" fill="#fff" />
          <circle cx="23" cy="11" r="0.8" fill="#fff" />
        </svg>
      )
    default:
      return null
  }
}
