/* Elegir el fondo del proyector: una muestra de cada uno, con su nombre al
   pasar el mouse (y para los lectores de pantalla). */
import { useT } from '../i18n.jsx'
import { FONDOS } from './fondos.js'

export function SelectorFondo({ valor, onCambiar }) {
  const t = useT()
  return (
    <div role="radiogroup" aria-label={t('fondoProyector')} className="flex flex-wrap gap-1.5">
      {FONDOS.map((f) => {
        const nombre = f[t.idioma] || f.es
        const elegido = valor === f.id
        return (
          <button key={f.id} role="radio" aria-checked={elegido} aria-label={nombre} title={nombre}
            onClick={() => onCambiar(f.id)}
            className={`w-11 h-8 rounded-lg border-2 transition ${elegido ? 'border-teal-600 ring-2 ring-teal-600/40' : 'border-slate-300'}`}
            style={f.css ? { background: f.css } : undefined}>
            {!f.css && <span className="text-xs text-slate-500">∅</span>}
          </button>
        )
      })}
    </div>
  )
}
