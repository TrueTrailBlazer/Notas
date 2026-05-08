export default function Icon({ name, fill = false, size, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
        fontSize: size ? `${size}px` : undefined,
      }}
    >
      {name}
    </span>
  )
}
