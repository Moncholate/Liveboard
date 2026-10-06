/* ============================================================================
   MODERAR
   ----------------------------------------------------------------------------
   Dos lugares, una misma lista:
     · el celular del docente (`conNombres`): privado, ahí sí se ve quién
       escribió qué, para poder conversarlo después;
     · el PC (`conNombres` apagado): si el PC es el del proyector, esto lo ve
       el curso, así que sin nombres, y con el aviso de que se está viendo.

   CORREGIR (6-oct-2026): en las abiertas, el docente puede arreglar un error
   chico en el momento. Se guarda aparte del original (sala.js), el proyector
   muestra solo la versión limpia y el estudiante ve en su celular qué cambió.
   ========================================================================== */
import { useState } from 'react'
import { LIMITES, abiertas, nube } from './logic.js'
import { Cambios } from './Cambios.jsx'
import { useT } from '../i18n.jsx'

export function Moderacion({ actividad, respuestas, moderacion, participantes, conNombres = false, onPalabra, onAbierta, onCorregir }) {
  const t = useT()
  if (actividad.tipo === 'nube') {
    const palabras = nube(respuestas, moderacion?.palabras)
    if (!palabras.length) return <p className="text-sm text-slate-500">{t('sinPalabras')}</p>
    return (
      <ul className="flex flex-col gap-1.5">
        {palabras.map(p => (
          <li key={p.clave} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${p.oculta ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
            <span className={`flex-1 min-w-0 truncate font-semibold ${p.oculta ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{p.texto}</span>
            {p.auto && <span className="text-xs font-bold text-rose-700">{t('filtro')}</span>}
            <span className="text-sm tabular-nums text-slate-500">{p.cuenta}</span>
            <button onClick={() => onPalabra(p.clave, p.oculta ? 'mostrar' : 'ocultar')}
              className={`rounded-lg px-3 py-1 text-sm font-bold border ${p.oculta ? 'border-teal-600 text-teal-700' : 'border-slate-300 text-slate-700'}`}>
              {p.oculta ? t('mostrar') : t('ocultar')}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  if (actividad.tipo === 'abierta') {
    const { pendientes, aprobadas, descartadas } = abiertas(respuestas, moderacion?.abiertas, participantes, moderacion?.correcciones)
    const Fila = ({ r, acciones }) => (
      <FilaAbierta r={r} conNombres={conNombres} acciones={acciones} onCorregir={onCorregir} />
    )
    const boton = (texto, clase, onClick) => (
      <button onClick={onClick} className={`rounded-lg px-3 py-1 text-sm font-bold ${clase}`}>{texto}</button>
    )
    return (
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t('porRevisar')} · {pendientes.length}</h3>
          {pendientes.length ? (
            <ul className="flex flex-col gap-1.5">
              {pendientes.map(r => (
                <Fila key={r.pid} r={r} acciones={<>
                  {boton(t('descartar'), 'border border-slate-300 text-slate-700', () => onAbierta(r.pid, false))}
                  {boton(t('aprobar'), 'bg-teal-700 text-white', () => onAbierta(r.pid, true))}
                </>} />
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">{t('sinPendientes')}</p>}
        </section>
        {aprobadas.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t('enPantalla')} · {aprobadas.length}</h3>
            <ul className="flex flex-col gap-1.5">
              {aprobadas.map(r => (
                <Fila key={r.pid} r={r} acciones={boton(t('quitar'), 'border border-slate-300 text-slate-700', () => onAbierta(r.pid, false))} />
              ))}
            </ul>
          </section>
        )}
        {descartadas.length > 0 && (
          <details>
            <summary className="text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer">{t('descartadas')} · {descartadas.length}</summary>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {descartadas.map(r => (
                <Fila key={r.pid} r={r} acciones={boton(t('aprobar'), 'border border-teal-600 text-teal-700', () => onAbierta(r.pid, true))} />
              ))}
            </ul>
          </details>
        )}
      </div>
    )
  }

  return <p className="text-sm text-slate-500">{t('sinModeracion')}</p>
}

/* UNA RESPUESTA ABIERTA, con su corrección. Va como componente propio y no
   dentro de Moderacion: el campo de corregir tiene estado, y definido adentro
   se rearmaba —y se vaciaba— cada vez que llegaba otra respuesta. */
function FilaAbierta({ r, conNombres, acciones, onCorregir }) {
  const t = useT()
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const abrir = () => { setTexto(r.texto); setEditando(true) }
  const guardar = () => { onCorregir?.(r.pid, texto, r.original); setEditando(false) }
  const chico = 'rounded-lg px-3 py-1 text-sm font-bold'

  return (
    <li className={`rounded-lg border px-3 py-2 ${r.groseria ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
      {editando ? (
        <>
          {/* Enter guarda y Esc cancela: se corrige en el momento, con el curso
              esperando, así que nada de buscar botones. */}
          <textarea value={texto} maxLength={LIMITES.abierta} rows={3} autoFocus aria-label={t('corregir')}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guardar() }
              if (e.key === 'Escape') { e.preventDefault(); setEditando(false) }
            }}
            className="w-full rounded-lg border-2 border-teal-600 px-2 py-1.5 font-semibold text-slate-800 outline-none" />
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs text-slate-500">{t('corregirAyuda')}</span>
            <span className="flex-1" />
            <button onClick={() => setEditando(false)} className={`${chico} border border-slate-300 text-slate-700`}>{t('cancelar')}</button>
            <button onClick={guardar} className={`${chico} bg-teal-700 text-white`}>{t('guardar')}</button>
          </div>
        </>
      ) : (
        <>
          {r.corregida
            ? <Cambios antes={r.original} despues={r.texto} className="font-semibold text-slate-800" />
            : <p className="font-semibold text-slate-800 break-words">{r.texto}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {conNombres && <span className="text-xs text-slate-500 truncate">{r.nombre}</span>}
            {r.groseria && <span className="text-xs font-bold text-rose-700">{t('filtro')}</span>}
            <span className="flex-1" />
            {onCorregir && (
              <button onClick={abrir} title={t('corregir')} className={`${chico} border border-slate-300 text-slate-700`}>
                ✎ {t('corregir')}
              </button>
            )}
            {onCorregir && r.corregida && (
              <button onClick={() => onCorregir(r.pid, '', r.original)} className={`${chico} border border-slate-300 text-slate-700`}>
                {t('quitarCorreccion')}
              </button>
            )}
            {acciones}
          </div>
        </>
      )}
    </li>
  )
}
