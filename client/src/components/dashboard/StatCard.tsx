interface StatCardProps {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: 'primary' | 'secondary' | 'tertiary' | 'error'
}

const colorMap = {
  primary: {
    icon: 'bg-primary-container text-primary',
    value: 'text-primary',
  },
  secondary: {
    icon: 'bg-secondary-container text-secondary',
    value: 'text-secondary',
  },
  tertiary: {
    icon: 'bg-tertiary-container text-tertiary',
    value: 'text-tertiary',
  },
  error: {
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-600',
  },
}

export default function StatCard({ icon, label, value, sub, color = 'primary' }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-sm flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
        <span className="material-icons-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${c.value}`}>{value}</p>
        {sub && <p className="text-xs text-outline mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
