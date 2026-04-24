interface StrandIconProps {
  strandId: string
  color: string
  className?: string
  style?: React.CSSProperties
}

export default function StrandIcon({ strandId, color, className, style }: StrandIconProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <circle cx="100" cy="100" r="95" fill={color} />
      {strandId === 'kindred' && (
        <g fill="none" stroke="#FCE8D5" strokeWidth="4" strokeLinecap="round">
          <circle cx="80" cy="100" r="32" />
          <circle cx="120" cy="100" r="32" />
          <path
            d="M 100 108 C 100 108, 92 100, 92 94 C 92 89, 96 86, 100 90 C 104 86, 108 89, 108 94 C 108 100, 100 108, 100 108 Z"
            fill="#FCE8D5"
            stroke="none"
          />
          <circle cx="100" cy="55" r="3" fill="#FCE8D5" stroke="none" />
          <circle cx="85" cy="60" r="2" fill="#FCE8D5" stroke="none" opacity="0.7" />
          <circle cx="115" cy="60" r="2" fill="#FCE8D5" stroke="none" opacity="0.7" />
        </g>
      )}
      {strandId === 'vitalis' && (
        <g stroke="#FCE8D5" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M 100 160 L 100 70" />
          <path d="M 100 140 Q 75 130, 70 110" />
          <path d="M 100 140 Q 125 130, 130 110" />
          <path d="M 100 110 Q 80 100, 75 85" />
          <path d="M 100 110 Q 120 100, 125 85" />
          <path d="M 100 75 Q 90 65, 92 55" />
          <path d="M 100 75 Q 110 65, 108 55" />
          <circle cx="70" cy="110" r="5" fill="#FCE8D5" stroke="none" />
          <circle cx="130" cy="110" r="5" fill="#FCE8D5" stroke="none" />
          <circle cx="75" cy="85" r="4" fill="#FCE8D5" stroke="none" />
          <circle cx="125" cy="85" r="4" fill="#FCE8D5" stroke="none" />
          <circle cx="92" cy="55" r="3" fill="#FCE8D5" stroke="none" />
          <circle cx="108" cy="55" r="3" fill="#FCE8D5" stroke="none" />
          <circle cx="100" cy="48" r="4" fill="#FCE8D5" stroke="none" />
          <path d="M 85 160 Q 100 155, 115 160" strokeLinecap="round" />
        </g>
      )}
      {strandId === 'vitrix' && (
        <g>
          <circle cx="100" cy="100" r="65" fill="none" stroke="#FCE8D5" strokeWidth="2" opacity="0.4" />
          <path
            d="M 45 100 L 70 100 L 78 85 L 88 120 L 98 70 L 108 115 L 118 100 L 155 100"
            fill="none"
            stroke="#FCE8D5"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="100" cy="35" r="3" fill="#FCE8D5" />
          <circle cx="165" cy="100" r="3" fill="#FCE8D5" />
          <circle cx="100" cy="165" r="3" fill="#FCE8D5" />
          <circle cx="35" cy="100" r="3" fill="#FCE8D5" />
          <circle cx="146" cy="54" r="2" fill="#FCE8D5" opacity="0.6" />
          <circle cx="146" cy="146" r="2" fill="#FCE8D5" opacity="0.6" />
          <circle cx="54" cy="146" r="2" fill="#FCE8D5" opacity="0.6" />
          <circle cx="54" cy="54" r="2" fill="#FCE8D5" opacity="0.6" />
        </g>
      )}
    </svg>
  )
}
