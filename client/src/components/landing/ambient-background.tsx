export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="orb orb-cyan -left-16 -top-16 size-48 sm:-left-24 sm:-top-24 sm:size-96" />
      <div
        className="orb orb-violet -right-20 top-1/4 size-52 sm:-right-32 sm:size-[28rem]"
        style={{ animationDelay: '1.2s' }}
      />
      <div
        className="orb orb-teal -bottom-20 left-1/4 size-44 sm:-bottom-32 sm:left-1/3 sm:size-80"
        style={{ animationDelay: '2.4s' }}
      />
      <div
        className="absolute inset-0 opacity-20 sm:opacity-30 dark:opacity-30 dark:sm:opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(oklch(from var(--neon-cyan) l c h / 8%) 1px, transparent 1px), linear-gradient(90deg, oklch(from var(--neon-cyan) l c h / 8%) 1px, transparent 1px)',
          backgroundSize: 'clamp(32px, 8vw, 64px) clamp(32px, 8vw, 64px)',
          maskImage: 'radial-gradient(ellipse 85% 70% at 50% 35%, black, transparent)',
        }}
      />
    </div>
  )
}
