// Shared silhouette SVG used for all people discs
interface PersonIconProps {
  color: string
  className?: string
  style?: React.CSSProperties
}

export default function PersonIcon({ color, className, style }: PersonIconProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <circle cx="100" cy="100" r="95" fill={color} />
      <circle cx="100" cy="100" r="72" fill="none" stroke="#FCE8D5" strokeWidth="2" opacity="0.35" />
      <circle cx="78"  cy="62"  r="2.5" fill="#FCE8D5" opacity="0.7" />
      <circle cx="100" cy="58"  r="2.5" fill="#FCE8D5" opacity="0.7" />
      <circle cx="122" cy="62"  r="2.5" fill="#FCE8D5" opacity="0.7" />
      <circle cx="100" cy="95" r="18" fill="none" stroke="#FCE8D5" strokeWidth="4" />
      <path
        d="M 68 145 C 68 125, 82 118, 100 118 C 118 118, 132 125, 132 145"
        fill="none"
        stroke="#FCE8D5"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}
