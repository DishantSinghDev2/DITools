import type { ReactNode } from "react"

export function ContentSection({
  id,
  title,
  children,
  description,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-pretty">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
