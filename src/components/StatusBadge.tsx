export function StatusBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-[20px] border border-white/20 bg-white/10 px-4 py-2">
      <span className="status-dot block h-1 w-1 rounded-full bg-white" />
      <span className="text-[13px] font-medium">
        <span className="text-white/60">Now accepting clients</span>
        <span className="text-white"> — Let's build</span>
      </span>
    </div>
  )
}
