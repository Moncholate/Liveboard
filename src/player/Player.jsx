/* ============================================================================
   EL CELULAR DEL ESTUDIANTE
   ----------------------------------------------------------------------------
   Entra con el PIN y un apodo, y responde lo que esté en el proyector. Mientras
   la actividad siga abierta puede cambiar su respuesta: equivocarse de botón no
   debería ser definitivo.

   El apodo lo ve solo el docente, en su celular. El proyector no muestra
   nombres, y esta pantalla lo dice: quien sabe que no lo van a exponer escribe
   lo que piensa.

   IDIOMA: antes de entrar no se sabe a qué sala va, así que la entrada usa el
   del navegador (y se puede cambiar). Ya dentro, manda el de la sala.
   ========================================================================== */
import { useEffect, useState } from 'react'
import { useStore, useValue } from '../net/hooks.js'
import { Button, Center, Logo } from '../ui.jsx'
import { ProveedorIdioma, SelectorIdioma, idiomaDelNavegador, traducir, useT, valido } from '../i18n.jsx'
import {
  ALTERNATIVAS, LIMITES, correccionVigente, idAlAzar, limpiarAbierta, nombreValido, palabrasDe, preguntasDelCurso,
} from '../live/logic.js'
import { Cambios } from '../live/Cambios.jsx'
import { BotonPdf, normalizar } from './Clase.jsx'
import { rutaResumen, urlResumen } from '../live/resumen.js'
import { comoLista, raiz } from '../live/sala.js'
import { useTema } from '../tema.jsx'

/* sessionStorage y no localStorage: cada pestaña es un estudiante distinto, y
   al recargar se vuelve a la misma sala con el mismo apodo. */
const sesion = {
  get: (k) => { try { return sessionStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v) } catch { /* modo privado */ } },
}
const pidKey = (pin) => `liveboard-pid-${pin}`

export default function Player({ initialPin }) {
  useTema()
  const store = useStore()
  const [yo, setYo] = useState(null)
  const [revisando, setRevisando] = useState(Boolean(initialPin && sesion.get(pidKey(initialPin))))
  const [idioma, setIdioma] = useState(idiomaDelNavegador)

  useEffect(() => {
    if (!store || !revisando) return
    const pid = sesion.get(pidKey(initialPin))
    store.get(`${raiz(initialPin)}/participantes/${pid}`)
      .then((p) => { if (p) setYo({ pin: initialPin, pid }) })
      .finally(() => setRevisando(false))
  }, [store])

  if (!store || revisando) return <Center>{traducir(idioma, 'cargando')}</Center>
  if (!yo) {
    return (
      <ProveedorIdioma value={idioma}>
        <Entrar store={store} initialPin={initialPin} onDentro={setYo} onIdioma={setIdioma} />
      </ProveedorIdioma>
    )
  }
  return <EnSala store={store} pin={yo.pin} pid={yo.pid}
    onFuera={() => { sesion.set(pidKey(yo.pin), null); setYo(null) }} />
}

function Entrar({ store, initialPin, onDentro, onIdioma }) {
  const t = useT()
  const [pin, setPin] = useState(initialPin || '')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const entrar = async (e) => {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      if (!(await store.get(`${raiz(pin)}/meta`))) throw new Error(t('noHaySala'))
      const pid = idAlAzar()
      await store.set(`${raiz(pin)}/participantes/${pid}`, { nombre: nombreValido(nombre), at: store.stamp() })
      sesion.set(pidKey(pin), pid)
      onDentro({ pin, pid })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const campo = 'rounded-xl border-2 border-slate-200 px-4 py-3 text-center focus:border-teal-600 outline-none'
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={entrar} className="w-full max-w-sm flex flex-col gap-3 text-center">
        <Logo className="text-5xl mb-4" />
        <input inputMode="numeric" maxLength={6} placeholder={t('pin')} value={pin} aria-label={t('pinSala')}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className={`${campo} text-2xl font-black tracking-widest`} />
        <input maxLength={LIMITES.nombre} placeholder={t('tuNombre')} value={nombre} aria-label={t('tuNombre')}
          onChange={(e) => setNombre(e.target.value)} className={`${campo} text-lg font-semibold`} />
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <Button disabled={pin.length !== 6 || !nombreValido(nombre) || enviando} className="text-lg">{t('entrar')}</Button>
        <p className="text-sm text-slate-500">{t('nombreNoAparece')}</p>
        <SelectorIdioma idioma={t.idioma} onCambiar={onIdioma} className="self-center mt-2" />
      </form>
    </div>
  )
}

function EnSala({ store, pin, pid, onFuera }) {
  const base = raiz(pin)
  const meta = useValue(store, `${base}/meta`)
  const idioma = valido(useValue(store, `${base}/idioma`))
  const estado = useValue(store, `${base}/estado`)
  const actividades = comoLista(useValue(store, `${base}/actividades`))
  const yo = useValue(store, `${base}/participantes/${pid}`)
  const resumenId = useValue(store, `${base}/resumen`)

  useEffect(() => store.presence(`${base}/online/${pid}`), [store, base, pid])

  /* La sala se cerró: de vuelta a la entrada, con aviso. */
  useEffect(() => { if (meta === null) { alert(traducir(idioma, 'profeCerro')); onFuera() } }, [meta])

  if (meta === undefined || estado === undefined) return <Center>{traducir(idioma, 'cargando')}</Center>
  const idx = estado?.idx ?? null
  const actividad = idx != null ? actividades[idx] : null

  return (
    <ProveedorIdioma value={idioma}>
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <Logo className="text-xl" />
          <span className="flex-1" />
          <span className="text-sm text-slate-500 truncate">{yo?.nombre}</span>
        </header>
        <main className="flex-1 flex flex-col p-4 max-w-md w-full mx-auto">
          {resumenId && <AvisoClase key={resumenId} store={store} id={resumenId} />}
          {actividad
            ? <Responder key={actividad.id} store={store} base={base} pid={pid} actividad={actividad} abierta={Boolean(estado.abierta)} />
            : <Espera />}
        </main>
      </div>
    </ProveedorIdioma>
  )
}

function Espera() {
  const t = useT()
  return <Center><p className="text-2xl font-bold text-slate-800">{t('estasDentro')}</p><p className="mt-2">{t('miraPantalla')}</p></Center>
}

function Responder({ store, base, pid, actividad, abierta }) {
  if (actividad.tipo === 'preguntas') return <PreguntarYVotar store={store} base={base} pid={pid} actividad={actividad} abierta={abierta} />
  return <ResponderUna store={store} base={base} pid={pid} actividad={actividad} abierta={abierta} />
}

function ResponderUna({ store, base, pid, actividad, abierta }) {
  const t = useT()
  const aid = actividad.id
  const mia = useValue(store, `${base}/respuestas/${aid}/${pid}`)
  const decision = useValue(store, actividad.tipo === 'abierta' ? `${base}/moderacion/${aid}/abiertas/${pid}` : null)
  const correccion = useValue(store, actividad.tipo === 'abierta' ? `${base}/moderacion/${aid}/correcciones/${pid}` : null)
  const [editando, setEditando] = useState(false)

  if (mia === undefined) return <Center>{t('cargando')}</Center>
  const enviar = async (valor) => {
    await store.set(`${base}/respuestas/${aid}/${pid}`, { ...valor, at: store.stamp() })
    setEditando(false)
  }
  const yaRespondio = mia && !editando

  return (
    <div className="flex-1 flex flex-col gap-4">
      <h1 className="text-2xl font-black text-slate-900 leading-snug">{actividad.pregunta}</h1>

      {yaRespondio ? (
        <Enviada actividad={actividad} mia={mia} decision={decision} correccion={correccion} abierta={abierta} onCambiar={() => setEditando(true)} />
      ) : !abierta ? (
        <p className="rounded-2xl bg-slate-100 p-4 text-center font-semibold text-slate-600">{t('respuestasCerradas')}</p>
      ) : actividad.tipo === 'nube' ? <FormNube inicial={mia?.palabras} onEnviar={enviar} />
        : actividad.tipo === 'encuesta' ? <FormEncuesta actividad={actividad} inicial={mia?.opcion} onEnviar={enviar} />
        : actividad.tipo === 'escala' ? <FormEscala inicial={mia?.valor} onEnviar={enviar} />
        : actividad.tipo === 'ranking' ? <FormRanking actividad={actividad} inicial={mia?.orden} onEnviar={enviar} />
        : <FormAbierta inicial={mia?.texto} onEnviar={enviar} />}
    </div>
  )
}

/* El veredicto primero y grande: que no quede duda de que se envió. */
function Enviada({ actividad, mia, decision, correccion, abierta, onCambiar }) {
  const t = useT()
  const lo = actividad.tipo === 'nube' ? (mia.palabras || []).join(' · ')
    : actividad.tipo === 'encuesta' ? `${ALTERNATIVAS[mia.opcion]?.letra}. ${actividad.alternativas?.[mia.opcion] ?? ''}`
    : actividad.tipo === 'escala' ? `${mia.valor} · ${t('escala')[mia.valor - 1] ?? ''}`
    : actividad.tipo === 'ranking' ? (mia.orden || []).map((i, p) => `${p + 1}. ${actividad.alternativas?.[i] ?? ''}`).join('  ')
    : mia.texto
  const corregida = actividad.tipo === 'abierta' ? correccionVigente(correccion, limpiarAbierta(mia.texto)) : null
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-teal-700 text-white p-5 text-center">
        <p className="text-3xl font-black">{t('listoGrande')}</p>
        <p className="mt-1 text-teal-50">{t('seEnvio')}</p>
      </div>
      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('tuRespuesta')}</p>
        {/* LA CORRECCIÓN DEL DOCENTE, solo aquí: es privada. El proyector muestra
            la versión limpia; lo que cambió lo ve únicamente quien la escribió. */}
        {corregida
          ? <Cambios antes={limpiarAbierta(mia.texto)} despues={corregida} className="mt-1 text-lg font-semibold text-slate-900" />
          : <p className="mt-1 text-lg font-semibold text-slate-900 break-words">{lo}</p>}
        {corregida && <p className="mt-2 text-sm font-bold text-teal-800">✎ {t('profeCorrigio')}</p>}
        {actividad.tipo === 'abierta' && (
          <p className="mt-2 text-sm text-slate-500">{decision === true ? t('enPantallaSinNombre') : t('profeRevisa')}</p>
        )}
      </div>
      {abierta && decision !== true && <Button variant="ghost" onClick={onCambiar}>{t('cambiarRespuesta')}</Button>}
    </div>
  )
}

function FormNube({ inicial, onEnviar }) {
  const t = useT()
  const [palabras, setPalabras] = useState(() => {
    const p = [...(inicial || [])]
    while (p.length < LIMITES.palabrasPorPersona) p.push('')
    return p
  })
  const limpias = palabrasDe(palabras)
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (limpias.length) onEnviar({ palabras: limpias }) }}>
      <p className="text-sm text-slate-500">{t('hastaPalabras', LIMITES.palabrasPorPersona)}</p>
      {palabras.map((p, i) => (
        <input key={i} value={p} maxLength={LIMITES.palabra} placeholder={t('palabraN', i + 1)} aria-label={t('palabraN', i + 1)}
          onChange={(e) => setPalabras(ps => ps.map((x, j) => (j === i ? e.target.value : x)))}
          className="rounded-xl border-2 border-slate-200 px-4 py-3 text-lg font-semibold focus:border-teal-600 outline-none" />
      ))}
      <Button disabled={!limpias.length} className="text-lg mt-1">{t('enviar')}</Button>
    </form>
  )
}

function FormEncuesta({ actividad, inicial, onEnviar }) {
  return (
    <div className="flex flex-col gap-2.5">
      {(actividad.alternativas || []).map((texto, i) => {
        const a = ALTERNATIVAS[i]
        return (
          <button key={i} onClick={() => onEnviar({ opcion: i })}
            className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left active:scale-[.98] transition ${inicial === i ? `${a.borde} ${a.tinte}` : 'border-slate-200 bg-white'}`}>
            <span className={`grid place-items-center w-10 h-10 shrink-0 rounded-xl text-white text-xl font-black ${a.solido}`}>{a.letra}</span>
            <span className="text-lg font-semibold text-slate-900">{texto}</span>
          </button>
        )
      })}
    </div>
  )
}

function FormEscala({ inicial, onEnviar }) {
  const t = useT()
  return (
    <div className="grid grid-cols-5 gap-2">
      {t('escala').map((r, i) => (
        <button key={i} onClick={() => onEnviar({ valor: i + 1 })}
          className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-4 active:scale-[.97] transition ${inicial === i + 1 ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white'}`}>
          <span className="text-3xl font-black text-slate-900">{i + 1}</span>
          <span className="text-[11px] leading-tight text-slate-500 text-center">{r}</span>
        </button>
      ))}
    </div>
  )
}

function FormAbierta({ inicial, onEnviar }) {
  const t = useT()
  const [texto, setTexto] = useState(inicial || '')
  const limpio = limpiarAbierta(texto)
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (limpio) onEnviar({ texto: limpio }) }}>
      <textarea value={texto} maxLength={LIMITES.abierta} rows={4} placeholder={t('escribeRespuesta')} aria-label={t('tuRespuesta')}
        onChange={(e) => setTexto(e.target.value)}
        className="rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-teal-600 outline-none resize-none" />
      <p className="text-right text-xs text-slate-400 tabular-nums">{texto.length}/{LIMITES.abierta}</p>
      <Button disabled={!limpio} className="text-lg">{t('enviar')}</Button>
    </form>
  )
}

/* ORDENAR: se tocan los elementos del primero al último y van subiendo a «Tu
   orden». Tocar uno de arriba lo devuelve. Nada de arrastrar: en un celular
   chico, arrastrar es lo que más falla. */
function FormRanking({ actividad, inicial, onEnviar }) {
  const t = useT()
  const alts = actividad.alternativas || []
  const [orden, setOrden] = useState(() => (Array.isArray(inicial) && inicial.length === alts.length ? inicial : []))
  const quedan = alts.map((_, i) => i).filter(i => !orden.includes(i))
  const fila = 'flex items-center gap-3 rounded-2xl border-2 p-3 text-left active:scale-[.98] transition'
  return (
    <div className="flex flex-col gap-3">
      {orden.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('tuOrden')} · <span className="normal-case font-normal">{t('tocaParaQuitar')}</span></p>
          {orden.map((i, p) => (
            <button key={i} onClick={() => setOrden(o => o.filter(x => x !== i))} className={`${fila} border-teal-600 bg-teal-50`}>
              <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-teal-700 text-white text-xl font-black">{p + 1}</span>
              <span className="text-lg font-semibold text-slate-900">{alts[i]}</span>
            </button>
          ))}
        </section>
      )}
      {quedan.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-sm text-slate-500">{orden.length ? t('faltanPorOrdenar', quedan.length) : t('tocaEnOrden')}</p>
          {quedan.map(i => (
            <button key={i} onClick={() => setOrden(o => [...o, i])} className={`${fila} border-slate-200 bg-white`}>
              <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 text-xl font-black">?</span>
              <span className="text-lg font-semibold text-slate-900">{alts[i]}</span>
            </button>
          ))}
        </section>
      )}
      <Button disabled={quedan.length > 0} onClick={() => onEnviar({ orden })} className="text-lg">{t('enviar')}</Button>
    </div>
  )
}

/* PREGUNTAS DEL CURSO: aquí no hay «una respuesta». Cada estudiante manda
   hasta 3 preguntas y vota las de otros que el docente ya aprobó.

   Todo lo suyo (preguntas y votos) vive en SU nodo y se reescribe entero en
   cada cambio: las reglas exigen la hora del servidor en cada escritura, y
   así ningún estudiante toca lo de otro. Cada pregunta guarda su hora la
   primera vez; las que ya tenían la conservan. */
function PreguntarYVotar({ store, base, pid, actividad, abierta }) {
  const t = useT()
  const aid = actividad.id
  const respuestas = useValue(store, `${base}/respuestas/${aid}`)
  const moderacion = useValue(store, `${base}/moderacion/${aid}`)
  const [texto, setTexto] = useState('')
  if (respuestas === undefined || moderacion === undefined) return <Center>{t('cargando')}</Center>

  const mio = respuestas?.[pid] || {}
  const guardar = (cambios) => store.set(`${base}/respuestas/${aid}/${pid}`, {
    preguntas: mio.preguntas || {}, votos: mio.votos || {}, ...cambios, at: store.stamp(),
  })
  const { pendientes, aprobadas, descartadas } = preguntasDelCurso(respuestas, moderacion, pid)
  const mias = [...pendientes, ...aprobadas, ...descartadas].filter(q => q.mia).sort((a, b) => a.at - b.at)
  const paraVotar = aprobadas.filter(q => !q.mia && !q.respondida)
  const cuantasMias = Object.keys(mio.preguntas || {}).length
  const limpio = limpiarAbierta(texto)

  const enviar = async (e) => {
    e.preventDefault()
    if (!limpio || cuantasMias >= LIMITES.preguntasPorPersona) return
    await guardar({ preguntas: { ...(mio.preguntas || {}), [idAlAzar()]: { texto: limpio, at: store.stamp() } } })
    setTexto('')
  }
  const borrar = (qid) => {
    const { [qid]: _, ...resto } = mio.preguntas || {}
    guardar({ preguntas: resto })
  }
  const votar = (qid, si) => {
    const { [qid]: _, ...resto } = mio.votos || {}
    guardar({ votos: si ? { ...resto, [qid]: true } : resto })
  }
  const estado = (q) => (q.decision === null ? t('estadoRevisando')
    : q.decision === false ? t('estadoNoSeMostro')
    : q.respondida ? `✓ ${t('respondida')}`
    : `${t('estadoEnPantalla')} · ▲ ${q.votos}`)

  return (
    <div className="flex-1 flex flex-col gap-4">
      <h1 className="text-2xl font-black text-slate-900 leading-snug">{actividad.pregunta}</h1>

      {!abierta ? (
        <p className="rounded-2xl bg-slate-100 p-4 text-center font-semibold text-slate-600">{t('respuestasCerradas')}</p>
      ) : cuantasMias >= LIMITES.preguntasPorPersona ? (
        <p className="rounded-2xl bg-slate-100 p-4 text-center font-semibold text-slate-600">{t('maxPreguntas', LIMITES.preguntasPorPersona)}</p>
      ) : (
        <form className="flex flex-col gap-2" onSubmit={enviar}>
          <textarea value={texto} maxLength={LIMITES.abierta} rows={3} placeholder={t('escribeTuPregunta')} aria-label={t('escribeTuPregunta')}
            onChange={(e) => setTexto(e.target.value)}
            className="rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-teal-600 outline-none resize-none" />
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm text-slate-500">{t('preguntaAnonima')}</p>
            <p className="text-xs text-slate-400 tabular-nums">{texto.length}/{LIMITES.abierta}</p>
          </div>
          <Button disabled={!limpio} className="text-lg">{t('enviarPregunta')}</Button>
        </form>
      )}

      {mias.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('tusPreguntas')}</h2>
          {mias.map(q => (
            <div key={q.qid} className="rounded-2xl bg-white border border-slate-200 p-3">
              {q.corregida
                ? <Cambios antes={q.original} despues={q.texto} className="font-semibold text-slate-900" />
                : <p className="font-semibold text-slate-900 break-words">{q.texto}</p>}
              {q.corregida && <p className="mt-1 text-sm font-bold text-teal-800">✎ {t('profeCorrigio')}</p>}
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`flex-1 text-sm font-bold ${q.decision === true ? 'text-teal-800' : 'text-slate-500'}`}>{estado(q)}</span>
                {abierta && q.decision === null && (
                  <button onClick={() => borrar(q.qid)} className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-bold text-slate-700">{t('borrarPregunta')}</button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('votaLasQue')}</h2>
        {paraVotar.length === 0 ? <p className="text-sm text-slate-500">{t('todaviaNadaQueVotar')}</p> : paraVotar.map(q => (
          <button key={q.qid} disabled={!abierta} onClick={() => votar(q.qid, !q.votada)} aria-pressed={q.votada}
            aria-label={`${q.votada ? t('quitarVoto') : t('votar')}: ${q.texto}`}
            className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left active:scale-[.98] transition disabled:opacity-60 ${q.votada ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white'}`}>
            <span className={`flex flex-col items-center justify-center w-12 h-12 shrink-0 rounded-xl font-black tabular-nums leading-none ${q.votada ? 'bg-teal-700 text-white' : 'border-2 border-slate-300 text-slate-600'}`}>
              <span aria-hidden="true" className="text-sm">▲</span>{q.votos}
            </span>
            <span className="text-lg font-semibold text-slate-900 break-words min-w-0">{q.texto}</span>
          </button>
        ))}
      </section>
    </div>
  )
}

/* LA CLASE PARA LLEVAR: cuando el docente comparte la clase, aparece aquí
   arriba con el botón para bajarla en PDF, sin escanear nada. El resumen se
   lee una sola vez, al aparecer el aviso; el PDF se arma en el celular. */
function AvisoClase({ store, id }) {
  const t = useT()
  const [resumen, setResumen] = useState(null)
  useEffect(() => {
    store.get(rutaResumen(id)).then(r => r && setResumen(normalizar(r)), () => {})
  }, [store, id])
  return (
    <div className="mb-4 rounded-2xl border-2 border-teal-600 bg-teal-50 p-4 flex flex-col gap-2">
      <p className="font-black text-teal-900">{t('profeCompartio')}</p>
      <p className="text-sm text-teal-900">{t('profeCompartioAyuda')}</p>
      {resumen ? <BotonPdf resumen={resumen} /> : <Button disabled>{t('cargando')}</Button>}
      <a href={urlResumen(id)} target="_blank" rel="noopener" className="text-sm font-semibold text-teal-800 underline underline-offset-2 self-center">{t('verClase')}</a>
    </div>
  )
}
