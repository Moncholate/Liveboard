/* ============================================================================
   LA LISTA DE ACTIVIDADES, PARA EDITAR
   ----------------------------------------------------------------------------
   La misma en dos lugares: al preparar la sala (Host) y en Mis materiales.
   `onMostrar`, si viene, agrega a cada tarjeta el botón para lanzarla: en Mis
   materiales no hay sala, así que no lo lleva.
   ========================================================================== */
import { useT } from '../i18n.jsx'
import { ALTERNATIVAS, LIMITES, TIPOS, actividadNueva, conAlternativas, problemaDe, rangoAlternativas } from '../live/logic.js'
import { Button } from '../ui.jsx'

export function Editor({ lista, setLista, onMostrar }) {
  const t = useT()
  const cambiar = (i, cambios) => setLista(l => l.map((a, j) => (j === i ? { ...a, ...cambios } : a)))
  const quitar = (i) => setLista(l => l.filter((_, j) => j !== i))
  const mover = (i, d) => setLista(l => {
    const j = i + d
    if (j < 0 || j >= l.length) return l
    const c = [...l];
    [c[i], c[j]] = [c[j], c[i]]
    return c
  })

  return (
    <div className="flex flex-col gap-3">
      {lista.map((a, i) => (
        <Tarjeta key={a.id || i} a={a} i={i} total={lista.length}
          onCambiar={(c) => cambiar(i, c)} onQuitar={() => quitar(i)} onMover={(d) => mover(i, d)}
          onMostrar={onMostrar ? () => onMostrar(i) : null} />
      ))}

      <div className="rounded-2xl border-2 border-dashed border-slate-300 p-4">
        <p className="text-sm font-bold text-slate-600 mb-2">{t('agregar')}</p>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map(tipo => (
            <button key={tipo} onClick={() => setLista(l => [...l, actividadNueva(tipo)])}
              title={t(`ayuda_${tipo}`)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-800">
              + {t(`tipo_${tipo}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Tarjeta({ a, i, total, onCambiar, onQuitar, onMover, onMostrar }) {
  const t = useT()
  const campo = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-600 outline-none'
  const problema = problemaDe(a)
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center w-7 h-7 rounded-full bg-slate-100 text-sm font-black text-slate-600">{i + 1}</span>
        <span className="text-sm font-bold text-teal-800">{t(`tipo_${a.tipo}`)}</span>
        <span className="flex-1" />
        <button onClick={() => onMover(-1)} disabled={i === 0} aria-label={t('subir')} className="px-2 text-slate-500 disabled:opacity-30">↑</button>
        <button onClick={() => onMover(1)} disabled={i === total - 1} aria-label={t('bajar')} className="px-2 text-slate-500 disabled:opacity-30">↓</button>
        <button onClick={onQuitar} className="px-2 text-sm text-rose-700">{t('quitar')}</button>
      </div>
      <input value={a.pregunta} maxLength={LIMITES.pregunta} placeholder={t('escribePregunta')}
        onChange={(e) => onCambiar({ pregunta: e.target.value })} className={`${campo} font-semibold`} />
      {conAlternativas(a.tipo) && <Alternativas a={a} campo={campo} onCambiar={onCambiar} />}
      <div className="flex items-center gap-3">
        <span className="flex-1 text-xs text-slate-500">{problema ? t(problema) : t(`ayuda_${a.tipo}`)}</span>
        {onMostrar && (
          <Button variant="ghost" className="!px-3 !py-1.5 text-sm" disabled={Boolean(problema)} onClick={onMostrar}>{t('mostrarEsta')}</Button>
        )}
      </div>
    </div>
  )
}

/* Las alternativas de una encuesta (A–D, con sus colores) o los elementos de
   un ranking (1–6, sin color: el número es su lugar en la lista, no una
   respuesta que se elige). */
function Alternativas({ a, campo, onCambiar }) {
  const t = useT()
  const alts = a.alternativas || []
  const { min, max } = rangoAlternativas(a.tipo)
  const ranking = a.tipo === 'ranking'
  const rotulo = (j) => (ranking ? String(j + 1) : ALTERNATIVAS[j].letra)
  return (
    <div className="flex flex-col gap-1.5">
      {alts.map((alt, j) => (
        <div key={j} className="flex items-center gap-2">
          <span className={`grid place-items-center w-8 h-8 shrink-0 rounded-lg font-black ${ranking ? 'bg-slate-100 text-slate-600' : `text-white ${ALTERNATIVAS[j].solido}`}`}>{rotulo(j)}</span>
          <input value={alt} maxLength={LIMITES.alternativa} placeholder={ranking ? t('elemento', j + 1) : t('alternativa', rotulo(j))}
            onChange={(e) => onCambiar({ alternativas: alts.map((x, k) => (k === j ? e.target.value : x)) })}
            className={campo} />
          {alts.length > min && (
            <button onClick={() => onCambiar({ alternativas: alts.filter((_, k) => k !== j) })}
              aria-label={ranking ? t('quitarElemento', j + 1) : t('quitarAlternativa', rotulo(j))} className="px-2 text-slate-400 hover:text-rose-700">×</button>
          )}
        </div>
      ))}
      {alts.length < max && (
        <button onClick={() => onCambiar({ alternativas: [...alts, ''] })} className="self-start text-sm font-semibold text-teal-800">
          {ranking ? t('masElemento') : t('masAlternativa')}
        </button>
      )}
    </div>
  )
}
