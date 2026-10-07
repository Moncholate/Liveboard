/* ============================================================================
   EL CELULAR DEL DOCENTE
   ----------------------------------------------------------------------------
   Para moderar en privado: aquí sí se ve quién escribió cada respuesta, porque
   esta pantalla no la ve nadie más. Y de paso es un control remoto: pasar de
   actividad, abrir o cerrar respuestas y mostrar u ocultar resultados sin
   volver al computador.

   Se entra con el enlace del botón «Celular» del proyector, que lleva la clave
   de la sala. Con el PIN solo, se entra como estudiante.
   ========================================================================== */
import { useMemo } from 'react'
import { useStore, useValue } from '../net/hooks.js'
import { Button, Center, Logo } from '../ui.jsx'
import { cuantosRespondieron } from '../live/logic.js'
import { ProveedorIdioma, traducir, useT, valido } from '../i18n.jsx'
import { accionesDeSala, comoLista, conectados, raiz } from '../live/sala.js'
import { Moderacion } from '../live/Moderacion.jsx'
import { Encuesta, Escala, Nube, Ranking } from '../live/Resultados.jsx'
import { useTema } from '../tema.jsx'

export default function Mod({ pin, clave }) {
  useTema()
  const store = useStore()
  const base = raiz(pin)
  const meta = useValue(store, `${base}/meta`)
  const idioma = valido(useValue(store, `${base}/idioma`))
  if (!store || meta === undefined) return <Center>{traducir(idioma, 'cargando')}</Center>
  if (!meta) return <Center>{traducir(idioma, 'salaNoExiste')}</Center>
  if (!clave || meta.clave !== clave) return <Center>{traducir(idioma, 'enlaceNoSirve')}</Center>
  return <ProveedorIdioma value={idioma}><Panel store={store} pin={pin} /></ProveedorIdioma>
}

function Panel({ store, pin }) {
  const t = useT()
  const base = raiz(pin)
  const estado = useValue(store, `${base}/estado`)
  const actividades = comoLista(useValue(store, `${base}/actividades`))
  const online = useValue(store, `${base}/online`)
  const participantes = useValue(store, `${base}/participantes`)
  const acciones = useMemo(() => accionesDeSala(store, pin), [store, pin])

  if (estado === undefined) return <Center>{t('cargando')}</Center>
  const idx = estado?.idx ?? null
  const actividad = idx != null ? actividades[idx] : null

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
        <Logo className="text-xl" />
        <span className="text-xs font-bold text-teal-800 bg-teal-50 rounded-full px-2 py-0.5">{t('docente')}</span>
        <span className="flex-1" />
        <span className="text-sm text-slate-600">{t('conectados', conectados(online))}</span>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4 max-w-md w-full mx-auto">
        {!actividad ? (
          <div className="flex flex-col gap-3">
            <p className="text-slate-600">{t('preparandoElige')}</p>
            {actividades.length === 0 && <p className="text-sm text-slate-500">{t('sinActividades')}</p>}
            {actividades.map((a, i) => (
              <button key={a.id || i} onClick={() => acciones.mostrar(i)} disabled={!a.pregunta}
                className="rounded-xl border border-slate-200 bg-white p-3 text-left disabled:opacity-50">
                <span className="block text-xs font-bold text-teal-800">{i + 1} · {t(`tipo_${a.tipo}`)}</span>
                <span className="block font-semibold text-slate-900">{a.pregunta || t('sinPregunta')}</span>
              </button>
            ))}
          </div>
        ) : (
          <EnVivo store={store} base={base} idx={idx} total={actividades.length} actividad={actividad}
            estado={estado} participantes={participantes} acciones={acciones} />
        )}
      </main>
    </div>
  )
}

function EnVivo({ store, base, idx, total, actividad, estado, participantes, acciones }) {
  const t = useT()
  const aid = actividad.id
  const respuestas = useValue(store, `${base}/respuestas/${aid}`)
  const moderacion = useValue(store, `${base}/moderacion/${aid}`)
  const n = cuantosRespondieron(respuestas)

  return (
    <>
      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t(`tipo_${actividad.tipo}`)} · {t('deTotal', idx + 1, total)}</p>
        <h1 className="text-xl font-black text-slate-900 leading-snug">{actividad.pregunta}</h1>
        <p className="text-sm text-slate-600 mt-1">{t('respondieron', n)}{estado.abierta ? '' : ` · ${t('cerradas')}`}</p>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Button variant="ghost" className="!py-2 text-sm" onClick={() => acciones.mostrar(idx - 1)} disabled={idx === 0}>{t('anterior')}</Button>
        {idx < total - 1
          ? <Button className="!py-2 text-sm" onClick={() => acciones.mostrar(idx + 1)}>{t('siguiente')}</Button>
          : <Button className="!py-2 text-sm" onClick={acciones.volverAPreparar}>{t('terminar')}</Button>}
        <Button variant="ghost" className="!py-2 text-sm" onClick={() => acciones.abrir(!estado.abierta)}>
          {estado.abierta ? t('cerrarRespuestas') : t('reabrir')}
        </Button>
        <Button variant="ghost" className="!py-2 text-sm" onClick={() => acciones.resultados(!estado.resultados)}>
          {estado.resultados ? t('ocultarResultados') : t('mostrarResultados')}
        </Button>
      </section>

      {['nube', 'abierta', 'preguntas'].includes(actividad.tipo) ? (
        <section>
          <h2 className="font-black text-slate-900 mb-2">{t('moderar')}</h2>
          <Moderacion actividad={actividad} respuestas={respuestas} moderacion={moderacion} participantes={participantes} conNombres
            onPalabra={(clave, d) => acciones.moderarPalabra(aid, clave, d)}
            onAbierta={(pid, d) => acciones.decidirAbierta(aid, pid, d)}
            onCorregir={(pid, texto, de) => acciones.corregirAbierta(aid, pid, texto, de)}
            onPregunta={(qid, d) => acciones.decidirPregunta(aid, qid, d)}
            onRespondida={(qid, si) => acciones.marcarRespondida(aid, qid, si)} />
        </section>
      ) : (
        <section className="rounded-2xl bg-white border border-slate-200 p-4">
          {actividad.tipo === 'encuesta' ? <Encuesta actividad={actividad} respuestas={respuestas} chico />
            : actividad.tipo === 'ranking' ? <Ranking actividad={actividad} respuestas={respuestas} chico />
            : <Escala respuestas={respuestas} chico />}
        </section>
      )}

      {actividad.tipo === 'nube' && (
        <section className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('asiSeVe')}</p>
          <Nube respuestas={respuestas} moderacion={moderacion?.palabras} chico />
        </section>
      )}
    </>
  )
}
