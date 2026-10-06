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
import { ALTERNATIVAS, LIMITES, correccionVigente, idAlAzar, limpiarAbierta, nombreValido, palabrasDe } from '../live/logic.js'
import { Cambios } from '../live/Cambios.jsx'
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
