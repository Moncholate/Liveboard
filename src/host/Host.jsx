/* ============================================================================
   EL PROYECTOR
   ----------------------------------------------------------------------------
   Dos momentos:
     · PREPARAR: el QR para entrar, el idioma de la sala y la lista de
       actividades, que se arma aquí o se carga de Mis materiales. Se puede
       volver aquí en cualquier momento para agregar o cambiar una.
     · PRESENTAR: una actividad a la vez, con sus resultados en vivo.

   Lo que se ve aquí lo ve el curso. Por eso no hay nombres en ninguna parte:
   en la sala de espera se dice cuántos entraron, no quiénes, y la moderación
   en el PC va sin nombres. Para moderar en privado está el celular (Mod.jsx).

   Las actividades del último uso quedan en este navegador para la próxima
   clase, y con cuenta se guardan en Mis materiales. No son datos de
   estudiantes: son las preguntas del docente.
   ========================================================================== */
import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useStore, useUser, useValue } from '../net/hooks.js'
import { isOnline } from '../net/store.js'
import { Button, Center, Logo, urlParaUnirse } from '../ui.jsx'
import { ProveedorIdioma, SelectorIdioma, idiomaDelNavegador, traducir, useT, valido } from '../i18n.jsx'
import { abiertas, cuantosRespondieron, idAlAzar, pinAlAzar, preguntasDelCurso, problemaDe } from '../live/logic.js'
import { accionesDeSala, comoLista, conectados, raiz } from '../live/sala.js'
import {
  actividadesParaSala, idMaterialNuevo, listaDeMateriales, materialParaGuardar, rutaMaterial, rutaMateriales,
} from '../live/materiales.js'
import { Abiertas, Encuesta, Escala, Nube, Preguntas, Ranking } from '../live/Resultados.jsx'
import { Moderacion } from '../live/Moderacion.jsx'
import { Editor } from './Editor.jsx'
import { Cuenta, iniciarSesion } from './Cuenta.jsx'
import { BotonTema, useTema } from '../tema.jsx'
import { fondoPorId, fondoValido } from '../live/fondos.js'
import { SelectorFondo } from '../live/SelectorFondo.jsx'
import { Lienzo } from '../live/Lienzo.jsx'
import { ALTO, enCursoVisible, rutaPizarra, trazosEnOrden, vistaValida, yValida } from '../live/pizarra.js'

const PIN_KEY = 'liveboard-host-pin'
const ULTIMAS_KEY = 'liveboard-ultimas'
export const IDIOMA_KEY = 'liveboard-idioma'
/* El fondo del proyector: es de este computador, no de la sala, porque solo
   lo ve el proyector (los celulares no lo usan). Un material lo trae consigo. */
const FONDO_KEY = 'liveboard-fondo'
/* El tema del proyector parte en claro: en una sala con luz se lee mejor. */
const TEMA_PROYECTOR_KEY = 'liveboard-tema-proyector'
/* Qué material se cargó en esta sala, para ofrecer «Guardar cambios en…». */
const ORIGEN_KEY = 'liveboard-origen'

export const guardado = {
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
    idioma: valido(guardado.get(IDIOMA_KEY) || idiomaDelNavegador()),
    estado: { abierta: false, resultados: false },
    ...(lista.length ? { actividades: lista } : {}),
  })
  guardado.set(PIN_KEY, pin)
  guardado.set(ORIGEN_KEY, null)
  return pin
}

export default function Host() {
  const store = useStore()
  const [pin, setPin] = useState(null)
  const [error, setError] = useState(null)
  const idioma = valido(guardado.get(IDIOMA_KEY) || idiomaDelNavegador())
  useEffect(() => {
    if (store) abrirSala(store).then(setPin, (e) => setError(e.message))
  }, [store])
  if (error) return <Center>{traducir(idioma, 'noSeCreo', error)}</Center>
  if (!pin) return <Center>{traducir(idioma, 'creandoSala')}</Center>
  return <Sala store={store} pin={pin} onCerrada={() => { guardado.set(PIN_KEY, null); location.hash = '' }} />
}

function Sala({ store, pin, onCerrada }) {
  const base = raiz(pin)
  const meta = useValue(store, `${base}/meta`)
  const idiomaRaw = useValue(store, `${base}/idioma`)
  const estado = useValue(store, `${base}/estado`)
  const actividadesRaw = useValue(store, `${base}/actividades`)
  const online = useValue(store, `${base}/online`)
  const participantes = useValue(store, `${base}/participantes`)
  const user = useUser(store)
  const acciones = useMemo(() => accionesDeSala(store, pin), [store, pin])
  const idioma = valido(idiomaRaw)
  const tema = useTema(TEMA_PROYECTOR_KEY, 'claro')
  const [fondo, setFondoEstado] = useState(() => fondoValido(guardado.get(FONDO_KEY)))
  const setFondo = (id) => { setFondoEstado(fondoValido(id)); guardado.set(FONDO_KEY, fondoValido(id)) }

  const actividades = comoLista(actividadesRaw)
  const idx = estado?.idx ?? null
  const actual = idx != null ? actividades[idx] : null

  /* Alguien cerró la sala desde otro lado (el celular): se vuelve al inicio. */
  useEffect(() => { if (meta === null) onCerrada() }, [meta])

  /* Las actividades también: Preparar las copia al montarse para editarlas. */
  if (meta === undefined || estado === undefined || actividadesRaw === undefined || idiomaRaw === undefined) {
    return <Center>{traducir(idioma, 'cargando')}</Center>
  }

  const cerrar = async () => {
    if (!confirm(traducir(idioma, 'confirmarCerrar'))) return
    await acciones.cerrarSala()
    onCerrada()
  }

  return (
    <ProveedorIdioma value={idioma}>
      {/* Con la pizarra, la pantalla justa: el papel ocupa lo que queda entre
          el encabezado y los botones, sin que nada se salga. */}
      <div className={`${estado?.pizarra ? 'h-[100dvh]' : 'min-h-screen'} flex flex-col`}>
        <Encabezado store={store} user={user} pin={pin} meta={meta} online={online} tema={tema} onCerrar={cerrar} acciones={acciones} />
        {estado?.pizarra
          ? <PizarraProyector store={store} pin={pin} acciones={acciones} />
          : actual
          ? <Presentar store={store} base={base} pin={pin} idx={idx} actividad={actual} total={actividades.length}
              estado={estado} participantes={participantes} acciones={acciones} fondo={fondo} />
          : <Preparar store={store} user={user} pin={pin} online={online} actividades={actividades} acciones={acciones}
              fondo={fondo} setFondo={setFondo} />}
      </div>
    </ProveedorIdioma>
  )
}

function Encabezado({ store, user, pin, meta, online, tema, onCerrar, acciones }) {
  const t = useT()
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 bg-white border-b border-slate-200">
      <Logo className="text-2xl" />
      {!isOnline && <span className="text-xs font-bold text-amber-800 bg-amber-100 rounded-full px-2.5 py-1">{t('modoLocal')}</span>}
      <span className="flex-1" />
      <span className="text-slate-600">{t('conectados', conectados(online))}</span>
      <span className="text-slate-500">{t('pin')} <b className="text-slate-900 tracking-widest">{pin}</b></span>
      <BotonTema tema={tema} etiqueta={tema.oscuro ? t('usarClaro') : t('usarOscuro')} />
      <Cuenta store={store} user={user} />
      <BotonPizarra pin={pin} clave={meta?.clave} acciones={acciones} />
      <BotonCelular pin={pin} clave={meta?.clave} />
      <Button variant="danger" className="!px-3 !py-1.5 text-sm" onClick={onCerrar}>{t('cerrarSala')}</Button>
    </header>
  )
}

/* ── Preparar ────────────────────────────────────────────────────────────── */

function Preparar({ store, user, pin, online, actividades, acciones, fondo, setFondo }) {
  const t = useT()
  /* Se edita en local y se guarda en la sala con una pausa: escribir en la base
     con cada tecla hace saltar el cursor cuando vuelve el eco. */
  const [lista, setLista] = useState(actividades)
  const primera = useRef(true)
  useEffect(() => {
    if (primera.current) { primera.current = false; return }
    const espera = setTimeout(() => {
      acciones.guardarActividades(lista)
      guardado.set(ULTIMAS_KEY, JSON.stringify(lista))
    }, 400)
    return () => clearTimeout(espera)
  }, [lista])

  const lanzar = async (i) => {
    await acciones.guardarActividades(lista)
    guardado.set(ULTIMAS_KEY, JSON.stringify(lista))
    acciones.mostrar(i)
  }
  const primeraLista = lista.findIndex(a => !problemaDe(a))

  const cambiarIdioma = (l) => {
    acciones.cambiarIdioma(l)
    guardado.set(IDIOMA_KEY, l)
  }

  return (
    <main className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 p-6">
      <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <Unirse pin={pin} online={online} />
        <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="font-bold text-slate-800">{t('idiomaSala')}</p>
            <p className="text-xs text-slate-500">{t('idiomaAyuda')}</p>
          </div>
          <SelectorIdioma idioma={t.idioma} onCambiar={cambiarIdioma} />
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col gap-2">
          <div>
            <p className="font-bold text-slate-800">{t('fondoProyector')}</p>
            <p className="text-xs text-slate-500">{t('fondoAyuda')}</p>
          </div>
          <SelectorFondo valor={fondo} onCambiar={setFondo} />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-900">{t('actividades')}</h2>
          <Button disabled={primeraLista < 0} onClick={() => lanzar(primeraLista)}>{t('empezar')}</Button>
        </div>
        <PanelMateriales store={store} user={user} lista={lista} fondo={fondo}
          onCargar={(m) => { setLista(actividadesParaSala(m)); cambiarIdioma(m.idioma); setFondo(m.fondo) }} />
        <Editor lista={lista} setLista={setLista} onMostrar={lanzar} />
      </section>
    </main>
  )
}

/* Cargar un material en la sala, o guardar lo que se armó aquí. */
function PanelMateriales({ store, user, lista, fondo, onCargar }) {
  const t = useT()
  const raw = useValue(store, user ? rutaMateriales(user.uid) : null)
  const materiales = listaDeMateriales(raw)
  const [elegido, setElegido] = useState('')
  const [aviso, setAviso] = useState(null)
  const [origen, setOrigen] = useState(() => {
    try { return JSON.parse(guardado.get(ORIGEN_KEY)) } catch { return null }
  })
  const recordar = (o) => { setOrigen(o); guardado.set(ORIGEN_KEY, o ? JSON.stringify(o) : null) }

  if (user === undefined) return null
  if (!user) {
    return (
      <div className="rounded-2xl bg-teal-50 border border-teal-200 p-4 flex flex-wrap items-center gap-3">
        <p className="flex-1 text-sm text-teal-900">{t('materialesSinSesion')}</p>
        <Button variant="ghost" className="!px-3 !py-1.5 text-sm" onClick={() => iniciarSesion(store, t.idioma)}>{t('iniciarSesion')}</Button>
      </div>
    )
  }

  const cargar = () => {
    const m = materiales.find(x => x.id === elegido)
    if (!m) return
    if (lista.length && !confirm(t('confirmarReemplazar'))) return
    onCargar(m)
    recordar({ id: m.id, nombre: m.nombre })
    setAviso(null)
  }

  const guardar = async (comoNuevo) => {
    let id = origen?.id
    let nombre = origen?.nombre
    if (comoNuevo || !id) {
      nombre = prompt(t('nombreParaGuardar'), nombre || '')
      if (!nombre || !nombre.trim()) return
      id = idMaterialNuevo()
    }
    const m = materialParaGuardar({ nombre, idioma: t.idioma, fondo, actividades: lista }, store.stamp())
    await store.set(rutaMaterial(user.uid, id), m)
    recordar({ id, nombre: m.nombre })
    setAviso(t('guardadoEn', m.nombre))
  }

  const sigueExistiendo = origen && materiales.some(m => m.id === origen.id)

  return (
    <div className="rounded-2xl bg-teal-50 border border-teal-200 p-4 flex flex-col gap-3">
      {materiales.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select value={elegido} onChange={(e) => setElegido(e.target.value)} aria-label={t('cargarMaterial')}
            className="flex-1 min-w-[12rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">{t('cargarMaterial')}…</option>
            {materiales.map(m => (
              <option key={m.id} value={m.id}>
                {m.nombre || t('sinNombre')} · {t('nActividades', m.actividades.length)} · {m.idioma.toUpperCase()}
              </option>
            ))}
          </select>
          <Button variant="ghost" className="!px-3 !py-1.5 text-sm" disabled={!elegido} onClick={cargar}>{t('cargar')}</Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {sigueExistiendo ? (
          <>
            <Button variant="ghost" className="!px-3 !py-1.5 text-sm" disabled={!lista.length} onClick={() => guardar(false)}>
              {t('guardarCambios', origen.nombre)}
            </Button>
            <Button variant="ghost" className="!px-3 !py-1.5 text-sm" disabled={!lista.length} onClick={() => guardar(true)}>
              {t('guardarComoNuevo')}
            </Button>
          </>
        ) : (
          <Button variant="ghost" className="!px-3 !py-1.5 text-sm" disabled={!lista.length} onClick={() => guardar(true)}>
            {t('guardarEnMateriales')}
          </Button>
        )}
        <a href="#/materiales" target="_blank" rel="noopener" className="text-sm font-semibold text-teal-800 underline underline-offset-2">
          {t('misMateriales')}
        </a>
        {aviso && <span role="status" className="text-sm text-teal-900">{aviso}</span>}
      </div>
    </div>
  )
}

function Unirse({ pin, online }) {
  const t = useT()
  const url = urlParaUnirse(pin)
  const qr = useQr(url, 420)
  return (
    <section className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col items-center justify-center text-center gap-3">
      <p className="text-xl font-bold text-slate-700">{t('escaneaParaEntrar')}</p>
      {qr && <img src={qr} alt={t('qrEntrar')} className="w-72 h-72" />}
      <p className="text-slate-500">{t('oEntraA')} <b className="text-slate-800 break-all">{url.split('#')[0]}</b> {t('conElPin')}</p>
      <p className="text-6xl font-black tracking-[.2em] text-slate-900">{pin}</p>
      <p className="text-lg text-slate-600">{t('conectados', conectados(online))}</p>
    </section>
  )
}

/* ── Presentar ───────────────────────────────────────────────────────────── */

function Presentar({ store, base, pin, idx, actividad, total, estado, participantes, acciones, fondo }) {
  const t = useT()
  const aid = actividad.id
  const respuestas = useValue(store, aid ? `${base}/respuestas/${aid}` : null)
  const moderacion = useValue(store, aid ? `${base}/moderacion/${aid}` : null)
  const [moderando, setModerando] = useState(false)
  const moderable = ['nube', 'abierta', 'preguntas'].includes(actividad.tipo)
  const n = cuantosRespondieron(respuestas)
  const aprobadasYPendientes = actividad.tipo === 'abierta' ? abiertas(respuestas, moderacion?.abiertas)
    : actividad.tipo === 'preguntas' ? preguntasDelCurso(respuestas, moderacion)
    : null
  const pendientes = aprobadasYPendientes?.pendientes.length || 0
  /* CON FONDO, CADA COSA LLEVA SU PROPIO PANEL, y no uno solo para todo. Iba un
     panel casi opaco del tamaño de la pantalla y el fondo quedaba reducido a un
     marco de 20 px: en una pregunta abierta se veía un cuadrado gigante y un
     borde de color. Ahora el panel envuelve solo lo que necesita respaldo para
     leerse (la pregunta, el contador, la nube y los gráficos) y las respuestas
     abiertas, que ya son tarjetas opacas, van directo sobre el fondo. */
  const f = fondoPorId(fondo)
  const conFondo = Boolean(f.css)
  const panel = conFondo ? 'panel-proyector rounded-3xl shadow-xl' : ''
  const sinPanel = estado.resultados && (aprobadasYPendientes?.aprobadas.length || 0) > 0

  return (
    <main className="flex-1 flex min-h-0">
      <div className="flex-1 flex flex-col min-w-0">
        <div className={`flex-1 flex flex-col min-h-0 ${conFondo ? 'p-5 gap-5' : ''}`} style={conFondo ? { background: f.css } : undefined}>
        <div className={`${panel} ${conFondo ? 'pb-6' : ''}`}>
          <div className="px-8 pt-6 flex items-center gap-3 text-slate-500">
            <span className="text-sm font-bold uppercase tracking-wider">{t(`tipo_${actividad.tipo}`)} · {t('deTotal', idx + 1, total)}</span>
            <span className="flex-1" />
            <JoinCorner pin={pin} />
          </div>
          <h1 className="px-8 pt-2 text-5xl font-black text-slate-900 leading-tight">{actividad.pregunta}</h1>
        </div>

        <div className={`flex-1 flex items-center justify-center min-h-0 overflow-auto ${conFondo ? 'px-3 py-2' : 'px-8 py-8'}`}>
          {estado.resultados ? (
            sinPanel
              ? <Resultados actividad={actividad} respuestas={respuestas} moderacion={moderacion} sobreFondo={conFondo} />
              : (
                <div className={`${panel} ${conFondo ? `p-8 ${actividad.tipo === 'nube' ? 'max-w-full' : 'w-full max-w-5xl'}` : 'w-full flex justify-center'}`}>
                  <Resultados actividad={actividad} respuestas={respuestas} moderacion={moderacion} />
                </div>
              )
          ) : (
            <div className={`text-center ${conFondo ? `${panel} px-14 py-8` : ''}`}>
              <p className="text-8xl font-black text-slate-900 tabular-nums">{n}</p>
              <p className="text-2xl text-slate-500 mt-2">{t('respuestaN', n)}</p>
            </div>
          )}
        </div>
        </div>

        <footer className="flex flex-wrap items-center gap-2 px-6 py-3 bg-white border-t border-slate-200">
          <Button variant="ghost" onClick={() => acciones.mostrar(idx - 1)} disabled={idx === 0}>{t('anterior')}</Button>
          <Button variant="ghost" onClick={() => acciones.abrir(!estado.abierta)}>
            {estado.abierta ? t('cerrarRespuestas') : t('reabrirRespuestas')}
          </Button>
          <Button variant="ghost" onClick={() => acciones.resultados(!estado.resultados)}>
            {estado.resultados ? t('ocultarResultados') : t('mostrarResultados')}
          </Button>
          {moderable && (
            <Button variant="ghost" onClick={() => setModerando(m => !m)} className={moderando ? '!border-teal-600 !text-teal-800' : ''}>
              {t('moderar')}{pendientes ? ` · ${pendientes}` : ''}
            </Button>
          )}
          <span className="flex-1 text-center text-slate-500">
            {t('respondieron', n)}{estado.abierta ? '' : ` · ${t('cerradas')}`}
          </span>
          <Button variant="ghost" onClick={acciones.volverAPreparar}>{t('actividades')}</Button>
          {idx < total - 1
            ? <Button onClick={() => acciones.mostrar(idx + 1)}>{t('siguiente')}</Button>
            : <Button onClick={acciones.volverAPreparar}>{t('terminar')}</Button>}
        </footer>
      </div>

      {moderando && moderable && (
        <aside className="w-96 shrink-0 border-l border-slate-200 bg-slate-50 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-slate-900">{t('moderar')}</h2>
            <button onClick={() => setModerando(false)} className="text-slate-500 text-sm">{t('cerrar')}</button>
          </div>
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 mb-3">
            {t('avisoModerarPc')}
          </p>
          <Moderacion actividad={actividad} respuestas={respuestas} moderacion={moderacion} participantes={participantes}
            onPalabra={(clave, d) => acciones.moderarPalabra(aid, clave, d)}
            onAbierta={(pid, d) => acciones.decidirAbierta(aid, pid, d)}
            onCorregir={(pid, texto, de) => acciones.corregirAbierta(aid, pid, texto, de)}
            onPregunta={(qid, d) => acciones.decidirPregunta(aid, qid, d)}
            onRespondida={(qid, si) => acciones.marcarRespondida(aid, qid, si)} />
        </aside>
      )}
    </main>
  )
}

function Resultados({ actividad, respuestas, moderacion, sobreFondo = false }) {
  switch (actividad.tipo) {
    case 'nube': return <Nube respuestas={respuestas} moderacion={moderacion?.palabras} />
    case 'encuesta': return <div className="w-full max-w-4xl mx-auto"><Encuesta actividad={actividad} respuestas={respuestas} /></div>
    case 'escala': return <div className="w-full max-w-4xl mx-auto"><Escala respuestas={respuestas} /></div>
    case 'abierta': return <Abiertas aprobadas={abiertas(respuestas, moderacion?.abiertas, {}, moderacion?.correcciones).aprobadas} sobreFondo={sobreFondo} />
    case 'ranking': return <div className="w-full max-w-4xl mx-auto"><Ranking actividad={actividad} respuestas={respuestas} /></div>
    case 'preguntas': return <Preguntas aprobadas={preguntasDelCurso(respuestas, moderacion).aprobadas} sobreFondo={sobreFondo} />
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
  const t = useT()
  const url = urlParaUnirse(pin)
  const [grande, setGrande] = useState(false)
  const qr = useQr(url, 720)
  if (!qr) return null
  return (
    <>
      <button onClick={() => setGrande(true)} className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 p-1.5 pr-3">
        <img src={qr} alt={t('qrEntrar')} className="w-14 h-14" />
        <span className="text-left leading-tight">
          <span className="block text-xs text-slate-500">{t('pin')}</span>
          <span className="block text-xl font-black tracking-widest text-slate-900">{pin}</span>
        </span>
      </button>
      {grande && (
        <div onClick={() => setGrande(false)} className="fixed inset-0 z-50 bg-white/95 grid place-items-center cursor-pointer">
          <div className="text-center">
            <img src={qr} alt={t('qrEntrar')} className="w-[min(60vh,80vw)] h-[min(60vh,80vw)] mx-auto" />
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
  const t = useT()
  const [abierto, setAbierto] = useState(false)
  const url = `${location.origin}${location.pathname}#/mod?pin=${pin}&clave=${clave}`
  const qr = useQr(abierto && clave ? url : null, 480)
  return (
    <>
      <Button variant="ghost" className="!px-3 !py-1.5 text-sm" onClick={() => setAbierto(true)} disabled={!clave}>{t('celular')}</Button>
      {abierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 grid place-items-center p-4" onClick={() => setAbierto(false)}>
          <div className="rounded-3xl bg-white p-6 max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-slate-900">{t('controlaCelular')}</h2>
            <p className="text-sm text-slate-600 mt-1">{t('controlaCelularAyuda')}</p>
            {qr && <img src={qr} alt={t('qrCelular')} className="w-64 h-64 mx-auto my-4" />}
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
              {t('avisoQrCelular')}
            </p>
            <Button className="mt-4 w-full" onClick={() => setAbierto(false)}>{t('listo')}</Button>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Pizarra ─────────────────────────────────────────────────────────────── */

/* El QR para la tablet, como el del celular: lleva la clave de la sala. */
function BotonPizarra({ pin, clave, acciones }) {
  const t = useT()
  const [abierto, setAbierto] = useState(false)
  const url = `${location.origin}${location.pathname}#/pizarra?pin=${pin}&clave=${clave}`
  const qr = useQr(abierto && clave ? url : null, 480)
  return (
    <>
      <Button variant="ghost" className="!px-3 !py-1.5 text-sm" onClick={() => setAbierto(true)} disabled={!clave}>{t('pizarra')}</Button>
      {abierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 grid place-items-center p-4" onClick={() => setAbierto(false)}>
          <div className="rounded-3xl bg-white p-6 max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-slate-900">{t('pizarraEnTablet')}</h2>
            <p className="text-sm text-slate-600 mt-1">{t('pizarraEnTabletAyuda')}</p>
            {qr && <img src={qr} alt={t('qrPizarra')} className="w-64 h-64 mx-auto my-4" />}
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
              {t('avisoQrPizarra')}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setAbierto(false)}>{t('listo')}</Button>
              <Button onClick={() => { acciones.pizarra(true); setAbierto(false) }}>{t('mostrarPizarra')}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* Lo que se escribe en la tablet, en vivo y en grande. Desde aquí solo se
   cambia de página y se vuelve a la actividad: escribir es cosa de la tablet. */
function PizarraProyector({ store, pin, acciones }) {
  const t = useT()
  const ruta = rutaPizarra(pin)
  const vista = vistaValida(useValue(store, `${ruta}/vista`))
  const trazosRaw = useValue(store, `${ruta}/paginas/${vista.pagina}/trazos`)
  const enCursoRaw = useValue(store, `${ruta}/enCurso`)
  const trazos = useMemo(() => trazosEnOrden(trazosRaw), [trazosRaw])
  const enCurso = useMemo(() => enCursoVisible(enCursoRaw, vista.pagina, trazosRaw), [enCursoRaw, vista.pagina, trazosRaw])
  const irA = (pagina) => store.set(`${ruta}/vista`, { ...vista, pagina, y: 0 })
  /* El proyector sigue a la tablet en el cuaderno; con la rueda del mouse
     también se baja desde aquí (y la tablet lo sigue a él). */
  const papel = useRef(null)
  const rueda = (e) => {
    const alto = papel.current?.getBoundingClientRect().height || 1
    store.update(`${ruta}/vista`, { y: yValida(vista.y + (e.deltaY / alto) * ALTO) })
  }

  return (
    <main className="flex-1 flex flex-col min-h-0">
      <Lienzo trazos={trazos} enCurso={enCurso} fondo={vista.fondo} y={vista.y} papelRef={papel} onWheel={rueda} className="flex-1 p-4" />
      <footer className="flex items-center gap-2 px-6 py-3 bg-white border-t border-slate-200">
        <Button variant="ghost" onClick={() => acciones.pizarra(false)}>{t('volverDePizarra')}</Button>
        <span className="flex-1" />
        <Button variant="ghost" onClick={() => irA(vista.pagina - 1)} disabled={vista.pagina === 0} aria-label={t('paginaAnterior')}>‹</Button>
        <span className="font-bold text-slate-700 tabular-nums">{t('paginaDe', vista.pagina + 1, vista.paginas)}</span>
        <Button variant="ghost" onClick={() => irA(vista.pagina + 1)} disabled={vista.pagina >= vista.paginas - 1} aria-label={t('paginaSiguiente')}>›</Button>
      </footer>
    </main>
  )
}
