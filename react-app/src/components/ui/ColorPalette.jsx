export const KEEP_COLORS = [
  { name: 'default', value: 'var(--color-surface)' },
  { name: 'red', value: '#f28b82' },
  { name: 'orange', value: '#fbbc04' },
  { name: 'yellow', value: '#fff475' },
  { name: 'green', value: '#ccff90' },
  { name: 'teal', value: '#a7ffeb' },
  { name: 'blue', value: '#cbf0f8' },
  { name: 'purple', value: '#d7aefb' },
  { name: 'pink', value: '#fdcfe8' },
  { name: 'brown', value: '#e6c9a8' },
  { name: 'gray', value: '#e8eaed' },
]

export default function ColorPalette({ selectedColor, onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-2 p-3 bg-surface border border-outline-variant rounded-xl shadow-xl z-[650]">
      {KEEP_COLORS.map((c) => (
        <button
          key={c.name}
          className={`w-8 h-8 rounded-full border border-black/10 hover:scale-110 transition-transform ${
            c.name === selectedColor ? 'ring-2 ring-primary ring-offset-1' : ''
          }`}
          style={{ backgroundColor: c.value }}
          title={c.name}
          onClick={() => onSelect(c.name)}
        />
      ))}
    </div>
  )
}
