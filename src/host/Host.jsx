/* ============================================================================
   EL PROYECTOR
   ----------------------------------------------------------------------------
   Dos momentos:
     · PREPARAR: el QR para entrar y la lista de actividades. Se puede volver
       aquí en cualquier momento para agregar o cambiar una.
     · PRESENTAR: una actividad a la vez, con sus resultados en vivo.

   Lo que se ve aquí lo ve el curso. Por eso no hay nombres en ninguna parte:
   en la sala de espera se dice cuántos entraron, no quiénes, y la moderación
   en el PC va sin nombres. Para moderar en privado está el celular (Mod.jsx).

   Las actividades del último uso quedan en este navegador para la próxima
   clase. No son datos de estudiantes: son las preguntas del docente.
   ========================================================================== */
import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useStore, useValue } from '../net/hooks.js'
import { isOnline } from '../net/store.js'
import { Button, Center, Logo, urlParaUnirse } from '../ui.jsx'
import { ALTERNATIVAS, LIMITES, TIPOS, abiertas, actividadNueva, cuantosRespondieron, idAlAzar, pinAlAzar, problemaDe } from '../live/logic.js'
import { accionesDeSala, comoLista, conectados, raiz } from '../live/sala.js'
import { Abiertas, Encuesta, Escala, Nube } from '../live/Resultados.jsx'
import { Moderacion } from '../live/Moderacion.jsx'

const PIN_KEY = 'liveboard-host-pin'
const ULTIMAS_KEY = 'liveboard-ultimas'

const guardado = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* modo privado */ } },
}

const ultimas = () => {
  try { return JSON.parse(guardado.get(ULTIMAS_KEY)) || [] } catch { return [] }
}

/* Si se recarga la pestaña, se vuelve a la misma sala: los estudiantes ya
   entraron con ese PIN. */
async function abrirSala(store) {
  const anterior = guardado.get(PIN_KEY)
  if (anterior && (await store.get(`${raiz(anterior)}/meta`))) return anterior
  let pin
  do pin = pinAlAzar()
  while (await store.get(`${raiz(pin)}/meta`))
  const lista = ultimas()
  await store.update(raiz(pin), {
    meta: { creada: store.stamp(), clave: idAlAzar() },
    estado: { abierta: false, resultados: false },
    ...(lista.length ? { actividades: lista } : {}),
  })
  guardado.set(PIN_KEY, pin)
  return pin
}

export default function Host() {
  const store = useStore()
  const [pin, setPin] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (store) abrirSala(store).then(setPin, (e) => setError(e.message))
  }, [store])
  if (error) return <Center>No se pudo crear la sala: {error}</Center>
  if (!pin) return <Center>Creando la sala…</Center>
  return <Sala store={store} pin={pin} onCerrada={() => { guardado.set(PIN_KEY, null); location.hash = '' }} />
}

function Sala({ store, pin, onCerrada }) {
  const base = raiz(pin)
  const meta = useValue(store, `${base}/meta`)
  const estado = useValue(store, `${base}/estado`)
  const actividadesRaw = useValue(store, `${base}/actividades`)
  const online = useValue(store, `${base}/online`)
  const participantes = useValue(store, `${base}/participantes`)
  const acciones = useMemo(() => accionesDeSala(store, pin), [store, pin])

  const actividades = comoLista(actividadesRaw)
  const idx = estado?.idx ?? null
  const actual = idx != null ? actividades[idx] : null

  /* Alguien cerró la sala desde otro lado (el celular): se vuelve al inicio. */
  useEffect(() => { if (meta === null) onCerrada() }, [meta])

  /* Las actividades también: Preparar las copia al montarse para editarlas. */
  if (meta === undefined || estado === undefined || actividadesRaw === undefined) return <Center>Cargando…</Center>

  const cerrar = async () => {
    if (!confirm('¿Cerrar la sala? Se borran las respuestas y los estudiantes salen.')) return
    await acciones.cerrarSala()
    onCerrada()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center gap-4 px-6 py-3 bg-white border-b border-slate-200">
        <Logo className="text-2xl" />
        {!isOnline && <span className="text-xs font-bold text-amber-800 bg-amber-100 rounded-full px-2.5 py-1">Modo local · solo este navegador</span>}
        <span className="flex-1" />
        <span className="text-slate-600"><b className="text-slate-900 tabular-nums">{conectados(online)}</b> conectados</span>
        <span className="text-slate-500">PIN <b className="text-slate-900 tracking-widest">{pin}</b></span>
        <BotonCelular pin={pin} clave={meta?.clave} />
        <Button variant="danger" className="!px-3 !py-1.5 text-sm" onClick={cerrar}>Cerrar sala</Button>
      </header>

      {actual
        ? <Presentar store={store} base={base} pin={pin} idx={idx} actividad={actual} total={actividades.length}
            estado={estado} participantes={participantes} acciones={acciones} />
        : <Preparar pin={pin} online={online} actividades={actividades} acciones={acciones} />}
    </div>
  )
}

/* ── Preparar ────────────────────────────────────────────────────────────── */

function Preparar({ pin, online, actividades, acciones }) {
  /* Se edita en local y se guarda en la sala con una pausa: escribir en la base
     con cada tecla hace saltar el cursor cuando vuelve el eco. */
  const [lista, setLista] = useState(actividades)
  const primera = useRef(true)
  useEffect(() => {
    if (primera.current) { primera.current = false; return }
    const t = setTimeout(() => {
      acciones.guardarActividades(lista)
      guardado.set(ULTIMAS_KEY, JSON.stringify(lista))
    }, 400)
    return () => clearTimeout(t)
  }, [lista])

  const cambiar = (i, cambios) => setLista(l => l.map((a, j) => (j === i ? { ...a, ...cambios } : a)))
  const quitar = (i) => setLista(l => l.filter((_, j) => j !== i))
  const mover = (i, d) => setLista(l => {
    const j = i + d
    if (j < 0 || j >= l.length) return l
    const c = [...l];
    [c[i], c[j]] = [c[j], c[i]]
    return c
  })

  const lanzar = async (i) => {
    await acciones.guardarActividades(lista)
    guardado.set(ULTIMAS_KEY, JSON.stringify(lista))
    acciones.mostrar(i)
  }
  const problemas = lista.map(problemaDe)
  const primeraLista = problemas.findIndex(p => !p)

  return (
    <main className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 p-6">
      <Unirse pin={pin} online={online} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-900">Actividades</h2>
          <Button disabled={primeraLista < 0} onClick={() => lanzar(primeraLista)}>Empezar</Button>
        </div>

        {lista.map((a, i) => (
          <Tarjeta key={a.id || i} a={a} i={i} total={lista.length} problema={problemas[i]}
            onCambiar={(c) => cambiar(i, c)} onQuitar={() => quitar(i)} onMover={(d) => mover(i, d)}
            onLanzar={() => lanzar(i)} />
        ))}

        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-4">
          <p className="text-sm font-bold text-slate-600 mb-2">Agregar</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TIPOS).map(([tipo, t]) => (
              <button key={tipo} onClick={() => setLista(l => [...l, actividadNueva(tipo)])}
                title={t.ayuda}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-800">
                + {t.nombre}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function Tarjeta({ a, i, total, problema, onCambiar, onQuitar, onMover, onLanzar }) {
  const campo = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-600 outline-none'
  const alts = a.alternativas || []
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="grid place-items-center w-7 h-7 rounded-full bg-slate-100 text-sm font-black text-slate-600">{i + 1}</span>
        <span className="text-sm font-bold text-teal-800">{TIPOS[a.tipo]?.nombre}</span>
        <span className="flex-1" />
        <button onClick={() => onMover(-1)} disabled={i === 0} aria-label="Subir" className="px-2 text-slate-500 disabled:opacity-30">↑</button>
        <button onClick={() => onMover(1)} disabled={i === total - 1} aria-label="Bajar" className="px-2 text-slate-500 disabled:opacity-30">↓</button>
        <button onClick={onQuitar} className="px-2 text-sm text-rose-700">Quitar</button>
      </div>
      <input value={a.pregunta} maxLength={LIMITES.pregunta} placeholder="Escribe la pregunta"
        onChange={(e) => onCambiar({ pregunta: e.target.value })} className={`${campo} font-semibold`} />
      {a.tipo === 'encuesta' && (
        <div className="flex flex-col gap-1.5">
          {alts.map((alt, j) => (
            <div key={j} className="flex items-center gap-2">
              <span className={`grid place-items-center w-8 h-8 shrink-0 rounded-lg text-white font-black ${ALTERNATIVAS[j].solido}`}>{ALTERNATIVAS[j].letra}</span>
              <input value={alt} maxLength={LIMITES.alternativa} placeholder={`Alternativa ${ALTERNATIVAS[j].letra}`}
                onChange={(e) => onCambiar({ alternativas: alts.map((x, k) => (k === j ? e.target.value : x)) })}
                className={campo} />
              {alts.length > LIMITES.minAlternativas && (
                <button onClick={() => onCambiar({ alternativas: alts.filter((_, k) => k !== j) })}
                  aria-label={`Quitar alternativa ${ALTERNATIVAS[j].letra}`} className="px-2 text-slate-400 hover:text-rose-700">×</button>
              )}
            </div>
          ))}
          {alts.length < LIMITES.maxAlternativas && (
            <button onClick={() => onCambiar({ alternativas: [...alts, ''] })} className="self-start text-sm font-semibold text-teal-800">
              + Alternativa
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="flex-1 text-xs text-slate-500">{problema || TIPOS[a.tipo]?.ayuda}</span>
        <Button variant="ghost" className="!px-3 !py-1.5 text-sm" disabled={Boolean(problema)} onClick={onLanzar}>Mostrar esta</Button>
      </div>
    </div>
  )
}

function Unirse({ pin, online }) {
  const url = urlParaUnirse(pin)
  const qr = useQr(url, 420)
  return (
    <section className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col items-center justify-center text-center gap-3 lg:sticky lg:top-6 lg:self-start">
      <p className="text-xl font-bold text-slate-700">Escanea para entrar</p>
      {qr && <img src={qr} alt="Código QR para entrar a la sala" className="w-72 h-72" />}
      <p className="text-slate-500">o entra a <b className="text-slate-800 break-all">{url.split('#')[0]}</b> con el PIN</p>
      <p className="text-6xl font-black tracking-[.2em] text-slate-900">{pin}</p>
      <p className="text-lg text-slate-600"><b className="text-slate-900 tabular-nums">{conectados(online)}</b> conectados</p>
    </section>
  )
}

/* ── Presentar ───────────────────────────────────────────────────────────── */

function Presentar({ store, base, pin, idx, actividad, total, estado, participantes, acciones }) {
  const aid = actividad.id
  const respuestas = useValue(store, aid ? `${base}/respuestas/${aid}` : null)
  const moderacion = useValue(store, aid ? `${base}/moderacion/${aid}` : null)
  const [moderando, setModerando] = useState(false)
  const moderable = actividad.tipo === 'nube' || actividad.tipo === 'abierta'
  const n = cuantosRespondieron(respuestas)
  const pendientes = actividad.tipo === 'abierta' ? abiertas(respuestas, moderacion?.abiertas).pendientes.length : 0

  return (
    <main className="flex-1 flex min-h-0">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-8 pt-6 flex items-center gap-3 text-slate-500">
          <span className="text-sm font-bold uppercase tracking-wider">{TIPOS[actividad.tipo]?.nombre} · {idx + 1} de {total}</span>
          <span className="flex-1" />
          <JoinCorner pin={pin} />
        </div>
        <h1 className="px-8 pt-2 text-5xl font-black text-slate-900 leading-tight">{actividad.pregunta}</h1>

        <div className="flex-1 px-8 py-8 flex items-center justify-center min-h-0 overflow-auto">
          {estado.resultados ? (
            <Resultados actividad={actividad} respuestas={respuestas} moderacion={moderacion} />
          ) : (
            <div className="text-center">
              <p className="text-8xl font-black text-slate-900 tabular-nums">{n}</p>
              <p className="text-2xl text-slate-500 mt-2">{n === 1 ? 'respuesta' : 'respuestas'}</p>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 px-6 py-3 bg-white border-t border-slate-200">
          <Button variant="ghost" onClick={() => acciones.mostrar(idx - 1)} disabled={idx === 0}>← Anterior</Button>
          <Button variant="ghost" onClick={() => acciones.abrir(!estado.abierta)}>
            {estado.abierta ? 'Cerrar respuestas' : 'Reabrir respuestas'}
          </Button>
          <Button variant="ghost" onClick={() => acciones.resultados(!estado.resultados)}>
            {estado.resultados ? 'Ocultar resultados' : 'Mostrar resultados'}
          </Button>
          {moderable && (
            <Button variant="ghost" onClick={() => setModerando(m => !m)} className={moderando ? '!border-teal-600 !text-teal-800' : ''}>
              Moderar{pendientes ? ` · ${pendientes}` : ''}
            </Button>
          )}
          <span className="flex-1 text-center text-slate-500">
            {n} {n === 1 ? 'respondió' : 'respondieron'}{estado.abierta ? '' : ' · respuestas cerradas'}
          </span>
          <Button variant="ghost" onClick={acciones.volverAPreparar}>Actividades</Button>
          {idx < total - 1
            ? <Button onClick={() => acciones.mostrar(idx + 1)}>Siguiente →</Button>
            : <Button onClick={acciones.volverAPreparar}>Terminar</Button>}
        </footer>
      </div>

      {moderando && moderable && (
        <aside className="w-96 shrink-0 border-l border-slate-200 bg-slate-50 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-slate-900">Moderar</h2>
            <button onClick={() => setModerando(false)} className="text-slate-500 text-sm">Cerrar</button>
          </div>
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 mb-3">
            Si este PC está en el proyector, el curso ve esta lista. Para moderar en privado, usa <b>Celular</b> arriba.
          </p>
          <Moderacion actividad={actividad} respuestas={respuestas} moderacion={moderacion} participantes={participantes}
            onPalabra={(clave, d) => acciones.moderarPalabra(aid, clave, d)}
            onAbierta={(pid, d) => acciones.decidirAbierta(aid, pid, d)} />
        </aside>
      )}
    </main>
  )
}

function Resultados({ actividad, respuestas, moderacion }) {
  switch (actividad.tipo) {
    case 'nube': return <Nube respuestas={respuestas} moderacion={moderacion?.palabras} />
    case 'encuesta': return <div className="w-full max-w-4xl"><Encuesta actividad={actividad} respuestas={respuestas} /></div>
    case 'escala': return <div className="w-full max-w-4xl"><Escala respuestas={respuestas} /></div>
    case 'abierta': return <Abiertas aprobadas={abiertas(respuestas, moderacion?.abiertas).aprobadas} />
    default: return null
  }
}

/* ── QR ──────────────────────────────────────────────────────────────────── */

function useQr(texto, ancho) {
  const [qr, setQr] = useState(null)
  useEffect(() => { if (texto) QRCode.toDataURL(texto, { margin: 1, width: ancho }).then(setQr) }, [texto, ancho])
  return qr
}

/* En plena actividad el QR queda chico en una esquina, por si llega alguien
   tarde; tocándolo se agranda. */
function JoinCorner({ pin }) {
  const url = urlParaUnirse(pin)
  const [grande, setGrande] = useState(false)
  const qr = useQr(url, 720)
  if (!qr) return null
  return (
    <>
      <button onClick={() => setGrande(true)} className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 p-1.5 pr-3">
        <img src={qr} alt="Código QR para entrar" className="w-14 h-14" />
        <span className="text-left leading-tight">
          <span className="block text-xs text-slate-500">PIN</span>
          <span className="block text-xl font-black tracking-widest text-slate-900">{pin}</span>
        </span>
      </button>
      {grande && (
        <div onClick={() => setGrande(false)} className="fixed inset-0 z-50 bg-white/95 grid place-items-center cursor-pointer">
          <div className="text-center">
            <img src={qr} alt="Código QR para entrar" className="w-[min(60vh,80vw)] h-[min(60vh,80vw)] mx-auto" />
            <p className="text-6xl font-black tracking-[.2em] text-slate-900 mt-4">{pin}</p>
          </div>
        </div>
      )}
    </>
  )
}

/* El enlace para moderar desde el celular lleva la clave de la sala: con el
   PIN solo se entra como estudiante. */
function BotonCelular({ pin, clave }) {
  const [abierto, setAbierto] = useState(false)
  const url = `${location.origin}${location.pathname}#/mod?pin=${pin}&clave=${clave}`
  const qr = useQr(abierto && clave ? url : null, 480)
  return (
    <>
      <Button variant="ghost" className="!px-3 !py-1.5 text-sm" onClick={() => setAbierto(true)} disabled={!clave}>Celular</Button>
      {abierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 grid place-items-center p-4" onClick={() => setAbierto(false)}>
          <div className="rounded-3xl bg-white p-6 max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-slate-900">Controla desde tu celular</h2>
            <p className="text-sm text-slate-600 mt-1">Ahí moderas en privado, con los nombres, y pasas las actividades.</p>
            {qr && <img src={qr} alt="Código QR para moderar desde el celular" className="w-64 h-64 mx-auto my-4" />}
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
              Este código es solo para ti: quien lo escanee puede moderar. Ciérralo apenas lo uses.
            </p>
            <Button className="mt-4 w-full" onClick={() => setAbierto(false)}>Listo</Button>
          </div>
        </div>
      )}
    </>
  )
}
