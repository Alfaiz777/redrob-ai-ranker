interface Item {
  label: string
  count: number
}

interface Props {
  title: string
  icon: string
  items: Item[]
  loading: boolean
  accentClass?: string
}

export default function ProgressBarList({
  title,
  icon,
  items,
  loading,
  accentClass = 'bg-primary',
}: Props) {
  const max = Math.max(...items.map((i) => i.count), 1)

  return (
    <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-icons-outlined text-on-surface-variant text-[18px]">{icon}</span>
        <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-surface-container rounded mb-1 w-3/4" />
              <div className="h-2 bg-surface-high rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 7).map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-on-surface truncate max-w-[70%]">
                  {item.label}
                </span>
                <span className="text-[10px] text-outline ml-2 flex-shrink-0">{item.count}</span>
              </div>
              <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${accentClass}`}
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
