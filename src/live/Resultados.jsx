/* ============================================================================
   LOS RESULTADOS, COMO SE PROYECTAN
   ----------------------------------------------------------------------------
   Los usa el proyector (grandes) y el celular del docente (`chico`). Ninguno
   recibe nombres: lo que se dibuja aquí lo ve todo el curso.
   ========================================================================== */
import { ALTERNATIVAS, conteoEncuesta, estadisticaEscala, nube, resultadoRanking, tamanoEnNube } from './logic.js'
import { useT } from '../i18n.jsx'
import { Cambios } from './Cambios.jsx'

/* Colores de la nube: los de las alternativas, en tonos que se leen sobre
   blanco. Se asignan por la clave, no por la posición, para que una palabra no
   cambie de color cada vez que llega una respuesta nueva. */
const COLORES_NUBE = ['text-violet-700', 'text-teal-700', 'text-orange-700', 'text-pink-700', 'text-sky-700', 'text-slate-800']
const colorDe = (clave) => COLORES_NUBE[[...clave].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 997, 7) % COLORES_NUBE.length]

export function Nube({ respuestas, moderacion, correcciones, chico = false }) {
  const t = useT()
  const visibles = nube(respuestas, moderacion, correcciones).filter(p => !p.oculta)
  if (!visibles.length) return <Vacio chico={chico}>{t('vacioNube')}</Vacio>
  const max = visibles[0].cuenta
  /* La más repetida al centro: se reparten alternando a cada lado. */
  const orden = []
  visibles.forEach((p, i) => (i % 2 ? orden.push(p) : orden.unshift(p)))
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 leading-none">
      {orden.map(p => (
        <span key={p.clave} title={`${p.cuenta}`}
          className={`font-extrabold animate-pop ${colorDe(p.clave)}`}
          style={{ fontSize: `${tamanoEnNube(p.cuenta, max) * (chico ? 0.45 : 1)}rem` }}>
          {p.texto}
        </span>
      ))}
    </div>
  )
}

export function Encuesta({ actividad, respuestas, chico = false }) {
  const alts = actividad.alternativas || []
  const { votos, total } = conteoEncuesta(respuestas, alts.length)
  return (
    <div className={`w-full flex flex-col ${chico ? 'gap-2' : 'gap-4'}`}>
      {alts.map((texto, i) => {
        const a = ALTERNATIVAS[i]
        const pct = total ? Math.round((votos[i] / total) * 100) : 0
        return (
          <div key={i} className="flex items-center gap-3">
            <span className={`shrink-0 grid place-items-center rounded-lg text-white font-black ${a.solido} ${chico ? 'w-7 h-7 text-sm' : 'w-12 h-12 text-2xl'}`}>{a.letra}</span>
            <div className="flex-1 min-w-0">
              <div className={`flex justify-between gap-3 font-bold text-slate-800 ${chico ? 'text-sm' : 'text-2xl mb-1'}`}>
                <span className="truncate">{texto}</span>
                <span className="tabular-nums shrink-0">{votos[i]} · {pct}%</span>
              </div>
              <div className={`w-full rounded-full bg-slate-100 overflow-hidden ${chico ? 'h-2' : 'h-5'}`}>
                <div className={`h-full rounded-full transition-all duration-500 ${a.solido}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Escala({ respuestas, chico = false }) {
  const t = useT()
  const { votos, total, promedio } = estadisticaEscala(respuestas)
  const max = Math.max(1, ...votos)
  return (
    <div className="w-full flex flex-col items-center">
      <p className={`font-black text-slate-900 tabular-nums ${chico ? 'text-2xl mb-2' : 'text-7xl mb-4'}`}>
        {promedio == null ? '–' : promedio.toLocaleString(t.idioma === 'en' ? 'en-US' : 'es-CL')}
        <span className={`font-bold text-slate-500 ${chico ? 'text-sm' : 'text-2xl'}`}> / 5</span>
      </p>
      <div className={`w-full flex items-end justify-center ${chico ? 'gap-2 h-24' : 'gap-6 h-[32vh]'}`}>
        {votos.map((v, i) => (
          <div key={i} className="flex-1 max-w-[9rem] h-full flex flex-col justify-end items-center">
            <span className={`font-bold text-slate-700 tabular-nums ${chico ? 'text-xs' : 'text-xl mb-1'}`}>{v}</span>
            <div className="w-full rounded-t-lg bg-teal-600 transition-all duration-500"
              style={{ height: `${(v / max) * 100}%`, minHeight: v ? 6 : 0 }} />
          </div>
        ))}
      </div>
      <div className={`w-full flex justify-center border-t-2 border-slate-200 ${chico ? 'gap-2 pt-1' : 'gap-6 pt-2'}`}>
        {t('escala').map((r, i) => (
          <div key={i} className="flex-1 max-w-[9rem] text-center">
            <p className={`font-black text-slate-900 ${chico ? 'text-sm' : 'text-3xl'}`}>{i + 1}</p>
            {!chico && <p className="text-base text-slate-500">{r}</p>}
          </div>
        ))}
      </div>
      {total === 0 && !chico && <p className="mt-4 text-slate-500">{t('sinRespuestas')}</p>}
    </div>
  )
}

/* Solo las aprobadas, y sin nombres. */
/* `sobreFondo`: las tarjetas van directo sobre el fondo del proyector, sin
   panel, así que llevan sombra para despegarse de él.
   Una respuesta CORREGIDA muestra qué cambió, tachado y subrayado (8-oct-2026:
   el docente quiere que el curso aprenda del error; como no lleva nombre, no
   expone a nadie). Con `verCambios` apagado se ve solo la versión limpia, con
   un ✎ discreto. */
export function Abiertas({ aprobadas, chico = false, sobreFondo = false, verCambios = true }) {
  const t = useT()
  if (!aprobadas.length) return <Vacio chico={chico}>{t('vacioAbiertas')}</Vacio>
  return (
    <div className={`w-full grid ${chico ? 'gap-2' : 'gap-4 sm:grid-cols-2 xl:grid-cols-3'}`}>
      {aprobadas.map(r => (
        <div key={r.pid} className={`relative rounded-2xl bg-white border border-slate-200 font-semibold text-slate-800 animate-pop ${chico ? 'p-2 text-sm' : 'p-5 text-2xl'} ${sobreFondo ? 'shadow-lg' : ''}`}>
          {r.corregida && verCambios ? <Cambios antes={r.original} despues={r.texto} /> : r.texto}
          {r.corregida && !verCambios && (
            <span title={t('corregida')} aria-label={t('corregida')}
              className={`absolute text-slate-400 font-normal ${chico ? 'top-1 right-1.5 text-xs' : 'top-2 right-3 text-base'}`}>✎</span>
          )}
        </div>
      ))}
    </div>
  )
}

/* El orden del curso: primero el que juntó más puntos. La barra es cuánto se
   acerca a «todos lo pusieron primero», y el puesto medio dice lo mismo en
   palabras. */
export function Ranking({ actividad, respuestas, chico = false }) {
  const t = useT()
  const alts = actividad.alternativas || []
  const { filas, total, maximo } = resultadoRanking(respuestas, alts.length)
  const numero = (x) => x.toLocaleString(t.idioma === 'en' ? 'en-US' : 'es-CL')
  return (
    <div className={`w-full flex flex-col ${chico ? 'gap-2' : 'gap-4'}`}>
      {filas.map((f) => {
        const pct = maximo ? Math.round((f.puntos / maximo) * 100) : 0
        return (
          <div key={f.i} className="flex items-center gap-3 transition-all">
            <span className={`shrink-0 grid place-items-center rounded-lg font-black ${f.puesto === 1 && total ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'} ${chico ? 'w-7 h-7 text-sm' : 'w-12 h-12 text-2xl'}`}>{f.puesto}</span>
            <div className="flex-1 min-w-0">
              <div className={`flex justify-between gap-3 font-bold text-slate-800 ${chico ? 'text-sm' : 'text-2xl mb-1'}`}>
                <span className="truncate">{alts[f.i]}</span>
                {f.promedio != null && <span className={`shrink-0 font-semibold text-slate-500 tabular-nums ${chico ? 'text-xs' : 'text-lg'}`}>{t('puestoMedio', numero(f.promedio))}</span>}
              </div>
              <div className={`w-full rounded-full bg-slate-100 overflow-hidden ${chico ? 'h-2' : 'h-5'}`}>
                <div className="h-full rounded-full bg-teal-600 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )
      })}
      <p className={`text-center text-slate-500 ${chico ? 'text-xs' : 'text-lg'}`}>{total ? t('ordenaron', total) : t('sinRespuestas')}</p>
    </div>
  )
}

/* Las preguntas aprobadas, sin nombres, de más a menos votadas. Las ya
   respondidas quedan al final, atenuadas: siguen ahí por si alguien quiere
   volver a ellas, pero no compiten con las que faltan. */
export function Preguntas({ aprobadas, chico = false, sobreFondo = false, verCambios = true }) {
  const t = useT()
  if (!aprobadas.length) return <Vacio chico={chico}>{t('vacioPreguntas')}</Vacio>
  return (
    <div className={`w-full flex flex-col ${chico ? 'gap-2' : 'gap-3 max-w-5xl mx-auto'}`}>
      {aprobadas.map(q => (
        <div key={q.qid} className={`flex items-center gap-4 rounded-2xl border animate-pop ${q.respondida ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200'} ${chico ? 'p-2 gap-2' : 'p-4'} ${sobreFondo ? 'shadow-lg' : ''}`}>
          <span className={`shrink-0 flex flex-col items-center leading-none font-black tabular-nums ${q.respondida ? 'text-slate-400' : 'text-teal-700'} ${chico ? 'w-8 text-sm' : 'w-14 text-3xl'}`}>
            <span aria-hidden="true" className={chico ? 'text-xs' : 'text-lg'}>▲</span>
            {q.votos}
            <span className="sr-only">{t('votosN', q.votos)}</span>
          </span>
          {q.corregida && verCambios
            ? <Cambios antes={q.original} despues={q.texto} className={`flex-1 min-w-0 font-semibold ${q.respondida ? 'text-slate-500' : 'text-slate-800'} ${chico ? 'text-sm' : 'text-2xl'}`} />
            : <p className={`flex-1 min-w-0 break-words font-semibold ${q.respondida ? 'text-slate-500' : 'text-slate-800'} ${chico ? 'text-sm' : 'text-2xl'}`}>{q.texto}</p>}
          {q.respondida && <span className={`shrink-0 font-bold text-slate-500 ${chico ? 'text-xs' : 'text-base'}`}>✓ {t('respondida')}</span>}
        </div>
      ))}
    </div>
  )
}

function Vacio({ children, chico }) {
  return <p className={`text-slate-400 text-center ${chico ? 'text-sm' : 'text-2xl'}`}>{children}</p>
}
