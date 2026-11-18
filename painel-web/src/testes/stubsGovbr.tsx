import type { ReactNode } from 'react'

// Substitutos HTML simples dos Web Components do GovBR-DS, usados só nos testes (ver setup.ts).
// Cada um reproduz apenas o que o painel usa: rótulo, valor, evento e estado.

type Base = { children?: ReactNode; className?: string }
type EventoDeCampo = (e: { currentTarget: { value: string } }) => void

export function BrButton(p: Base & { onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; 'aria-label'?: string }) {
  return <button type={p.type ?? 'button'} onClick={p.onClick} disabled={p.disabled} aria-label={p['aria-label']}>{p.children}</button>
}

export function BrInput(p: Base & { label?: string; name?: string; type?: string; value?: string; onInput?: EventoDeCampo; required?: boolean }) {
  return (
    <label>
      {p.label}
      <input name={p.name} type={p.type ?? 'text'} value={p.value ?? ''} required={p.required}
        onChange={(e) => p.onInput?.({ currentTarget: { value: e.currentTarget.value } })} />
    </label>
  )
}

export function BrTextarea(p: Base & { label?: string; name?: string; value?: string; onInput?: EventoDeCampo }) {
  return (
    <label>
      {p.label}
      <textarea name={p.name} value={p.value ?? ''} onChange={(e) => p.onInput?.({ currentTarget: { value: e.currentTarget.value } })} />
    </label>
  )
}

export function BrSwitch(p: Base & { label?: string; checked?: boolean; onChange?: (e: { currentTarget: { checked: boolean } }) => void }) {
  return (
    <label>
      {p.label}
      <input type="checkbox" checked={!!p.checked} onChange={(e) => p.onChange?.({ currentTarget: { checked: e.currentTarget.checked } })} />
    </label>
  )
}

export function BrMessage(p: Base & { message?: string; messageTitle?: string; state?: string; role?: string }) {
  return <div role={p.role ?? 'status'} data-state={p.state}>{p.messageTitle ? `${p.messageTitle} ` : ''}{p.message}</div>
}

export function BrTag(p: Base & { label?: string }) {
  return <span>{p.label}</span>
}

export function BrLoading(p: Base & { label?: string }) {
  return <div role="progressbar">{p.label ?? 'Carregando'}</div>
}
