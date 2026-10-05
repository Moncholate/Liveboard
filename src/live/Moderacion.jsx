/* ============================================================================
   MODERAR
   ----------------------------------------------------------------------------
   Dos lugares, una misma lista:
     · el celular del docente (`conNombres`): privado, ahí sí se ve quién
       escribió qué, para poder conversarlo después;
     · el PC (`conNombres` apagado): si el PC es el del proyector, esto lo ve
       el curso, así que sin nombres, y con el aviso de que se está viendo.
   ========================================================================== */
import { abiertas, nube } from './logic.js'

export function Moderacion({ actividad, respuestas, moderacion, participantes, conNombres = false, onPalabra, onAbierta }) {
  if (actividad.tipo === 'nube') {
    const palabras = nube(respuestas, moderacion?.palabras)
    if (!palabras.length) return <p className="text-sm text-slate-500">Todavía no llegan palabras.</p>
    return (
      <ul className="flex flex-col gap-1.5">
        {palabras.map(p => (
          <li key={p.clave} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${p.oculta ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
            <span className={`flex-1 min-w-0 truncate font-semibold ${p.oculta ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{p.texto}</span>
            {p.auto && <span className="text-xs font-bold text-rose-700">filtro</span>}
            <span className="text-sm tabular-nums text-slate-500">{p.cuenta}</span>
            <button onClick={() => onPalabra(p.clave, p.oculta ? 'mostrar' : 'ocultar')}
              className={`rounded-lg px-3 py-1 text-sm font-bold border ${p.oculta ? 'border-teal-600 text-teal-700' : 'border-slate-300 text-slate-700'}`}>
              {p.oculta ? 'Mostrar' : 'Ocultar'}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  if (actividad.tipo === 'abierta') {
    const { pendientes, aprobadas, descartadas } = abiertas(respuestas, moderacion?.abiertas, participantes)
    const Fila = ({ r, acciones }) => (
      <li className={`rounded-lg border px-3 py-2 ${r.groseria ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
        <p className="font-semibold text-slate-800 break-words">{r.texto}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {conNombres && <span className="text-xs text-slate-500 truncate">{r.nombre}</span>}
          {r.groseria && <span className="text-xs font-bold text-rose-700">filtro</span>}
          <span className="flex-1" />
          {acciones}
        </div>
      </li>
    )
    const boton = (texto, clase, onClick) => (
      <button onClick={onClick} className={`rounded-lg px-3 py-1 text-sm font-bold ${clase}`}>{texto}</button>
    )
    return (
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Por revisar · {pendientes.length}</h3>
          {pendientes.length ? (
            <ul className="flex flex-col gap-1.5">
              {pendientes.map(r => (
                <Fila key={r.pid} r={r} acciones={<>
                  {boton('Descartar', 'border border-slate-300 text-slate-700', () => onAbierta(r.pid, false))}
                  {boton('Aprobar', 'bg-teal-700 text-white', () => onAbierta(r.pid, true))}
                </>} />
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No hay respuestas pendientes.</p>}
        </section>
        {aprobadas.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">En pantalla · {aprobadas.length}</h3>
            <ul className="flex flex-col gap-1.5">
              {aprobadas.map(r => (
                <Fila key={r.pid} r={r} acciones={boton('Quitar', 'border border-slate-300 text-slate-700', () => onAbierta(r.pid, false))} />
              ))}
            </ul>
          </section>
        )}
        {descartadas.length > 0 && (
          <details>
            <summary className="text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer">Descartadas · {descartadas.length}</summary>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {descartadas.map(r => (
                <Fila key={r.pid} r={r} acciones={boton('Aprobar', 'border border-teal-600 text-teal-700', () => onAbierta(r.pid, true))} />
              ))}
            </ul>
          </details>
        )}
      </div>
    )
  }

  return <p className="text-sm text-slate-500">Esta actividad no necesita moderación: no hay texto libre.</p>
}
