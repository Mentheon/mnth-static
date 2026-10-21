import PersonIcon from './PersonIcon'
import type { Person } from '../data/people'

interface PersonAvatarProps {
  person: Person
  /** Ring colour for the photo, and fill colour for the silhouette fallback. */
  color: string
  className?: string
  style?: React.CSSProperties
}

/* A person's headshot as a disc, framed by a ring in the same colour
   the PersonIcon silhouette would use (so selected/default states read
   the same). Falls back to the silhouette when there's no photo. */
export default function PersonAvatar({ person, color, className, style }: PersonAvatarProps) {
  if (!person.photo) return <PersonIcon color={color} className={className} style={style} />
  return (
    <img
      src={`${import.meta.env.BASE_URL}${person.photo}`}
      alt=""
      loading="lazy"
      decoding="async"
      className={className}
      style={{
        objectFit: 'cover',
        borderRadius: '50%',
        boxShadow: `0 0 0 4px ${color}`,
        transition: 'box-shadow 0.25s ease',
        ...style,
      }}
    />
  )
}
