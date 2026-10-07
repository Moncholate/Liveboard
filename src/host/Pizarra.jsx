/* ============================================================================
   LA TABLET DEL DOCENTE: EL PIZARRÓN
   ----------------------------------------------------------------------------
   Se entra con el QR del botón «Pizarra» del proyector, que lleva la clave de
   la sala. Lo que se escribe aquí aparece en el proyector mientras se escribe.

   LA PALMA NO RAYA: apenas se usa el lápiz, los toques con el dedo dejan de
   dibujar. Antes de usar el lápiz, el dedo sí dibuja (por si no hay lápiz).

   EL BOTÓN DEL S PEN BORRA: con el botón lateral apretado el trazo es de
   borrador, sin tocar la barra, y al soltarlo se vuelve al lápiz que estaba.
   Vale apretarlo antes de apoyar la punta o a mitad del trazo (pizarra.js,
   botonDeBorrar). Si una tablet lo avisa distinto, #/lapiz muestra qué manda.

   El trazo se dibuja aquí al tiro, sin esperar a la base: la tablet no puede
   sentirse lenta. Al proyector le llega por partes cada 80 ms (pizarra.js).
   ========================================================================== */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, useValue } from '../net/hooks.js'
import { Center } from '../ui.jsx'
import { ProveedorIdioma, traducir, useT, valido } from '../i18n.jsx'
import { raiz } from '../live/sala.js'
import {
  ALTO, ANCHO, COLORES, FONDOS_PIZARRA, GROSORES, GROSOR_BORRADOR, MAX_PAGINAS,
  botonDeBorrar, codificar, idDeTrazo, lejos, rutaPizarra, trazosEnOrden, ultimoTrazo, vistaValida,
} from '../live/pizarra.js'
import { Lienzo } from '../live/Lienzo.jsx'
import { useTema } from '../tema.jsx'

const CADA_MS = 80

export default function Pizarra({ pin, clave }) {
  useTema()
  const store = useStore()
  const base = raiz(pin)
  const meta = useValue(store, `${base}/meta`)
  const idioma = valido(useValue(store, `${base}/idioma`))
  if (!store || meta === undefined) return <Center>{traducir(idioma, 'cargando')}</Center>
  if (!meta) return <Center>{traducir(idioma, 'salaNoExiste')}</Center>
  if (!clave || meta.clave !== clave) return <Center>{traducir(idioma, 'enlaceNoSirvePizarra')}</Center>
  return <ProveedorIdioma value={idioma}><Tablero store={store} pin={pin} /></ProveedorIdioma>
}

function Tablero({ store, pin }) {
  const t = useT()
  const ruta = rutaPizarra(pin)
  const vista = vistaValida(useValue(store, `${ruta}/vista`))
  const estado = useValue(store, `${raiz(pin)}/estado`)
  const trazosRaw = useValue(store, `${ruta}/paginas/${vista.pagina}/trazos`)
  const trazos = useMemo(() => trazosEnOrden(trazosRaw), [trazosRaw])
  const proyectando = Boolean(estado?.pizarra)

  const [color, setColor] = useState(COLORES[0].hex)
  const [grosor, setGrosor] = useState(GROSORES[0])
  const [borrador, setBorrador] = useState(false)
  const [enCurso, setEnCurso] = useState(null)

  const papel = useRef(null)
  const trazo = useRef(null) // { id, pg, puntos, enviados, parte }
  const conLapiz = useRef(false)
  const cuadro = useRef(0)

  const cambiarVista = (cambios) => store.set(`${ruta}/vista`, { ...vista, ...cambios })

  const punto = (e) => {
    const r = papel.current.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * ANCHO, ((e.clientY - r.top) / r.height) * ALTO]
  }
  /* Cómo se ve un trazo según sus datos guardados ({ c, g, b? }). */
  const comoSeVe = (tr, puntos) => ({ color: tr.datos.c, grosor: tr.datos.g, borrador: Boolean(tr.datos.b), puntos })
  const pintar = () => {
    if (cuadro.current) return
    cuadro.current = requestAnimationFrame(() => {
      cuadro.current = 0
      const tr = trazo.current
      setEnCurso(tr ? comoSeVe(tr, [...tr.puntos]) : null)
    })
  }

  /* Lo que falta mandar del trazo en curso, como una parte nueva. */
  const enviarPendiente = () => {
    const tr = trazo.current
    if (!tr || tr.enviados >= tr.puntos.length) return
    const nuevos = tr.puntos.slice(tr.enviados)
    tr.enviados = tr.puntos.length
    store.update(`${ruta}/enCurso/partes`, { [tr.parte++]: codificar(nuevos) })
  }
  useEffect(() => {
    const id = setInterval(enviarPendiente, CADA_MS)
    return () => clearInterval(id)
  }, [])

  /* El botón del S Pen manda: apretarlo o soltarlo A MITAD DE UN TRAZO lo
     corta ahí y sigue con otro, de borrador o de lápiz. Así da lo mismo si
     el botón se aprieta antes de apoyar la punta o después. */
  const datosTrazo = (borra) => (borra ? { c: color, g: GROSOR_BORRADOR, b: true } : { c: color, g: grosor })

  const empezar = (p, pointerId, borra) => {
    const datos = datosTrazo(borrador || borra)
    trazo.current = { id: idDeTrazo(), pg: vista.pagina, datos, puntos: [p], enviados: 1, parte: 1, pointerId }
    store.set(`${ruta}/enCurso`, { id: trazo.current.id, pg: vista.pagina, ...datos, partes: { 0: codificar([p]) } })
    pintar()
  }
  const terminar = (tr) => {
    trazo.current = null
    /* Se borra el «en curso» solo si no empezó otro trazo mientras tanto:
       escribiendo rápido, borraría el siguiente. Si queda, el proyector lo
       ignora porque su id ya está entre los guardados. */
    store.set(`${ruta}/paginas/${tr.pg}/trazos/${tr.id}`, { ...tr.datos, p: codificar(tr.puntos) })
      .then(() => { if (!trazo.current) store.remove(`${ruta}/enCurso`) })
  }

  const bajar = (e) => {
    if (e.pointerType === 'pen') conLapiz.current = true
    else if (e.pointerType === 'touch' && conLapiz.current) return
    if (trazo.current) return
    /* Capturar el puntero hace que el trazo siga aunque el lápiz salga del
       papel. Si el navegador no lo permite, se escribe igual. */
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sin captura */ }
    empezar(punto(e), e.pointerId, botonDeBorrar(e))
  }
  const mover = (e) => {
    const tr = trazo.current
    if (!tr || e.pointerId !== tr.pointerId) return
    if (!borrador && e.pointerType === 'pen' && botonDeBorrar(e) !== Boolean(tr.datos.b)) {
      const p = punto(e)
      tr.puntos.push(p)
      terminar(tr)
      empezar(p, e.pointerId, botonDeBorrar(e))
      return
    }
    /* Los movimientos que el navegador juntó entre dos cuadros: con ellos la
       letra sale fina aunque la pantalla vaya lenta. Si no los da (o vienen
       vacíos), basta el movimiento mismo. */
    const juntos = e.nativeEvent.getCoalescedEvents?.() || []
    const eventos = juntos.length ? juntos : [e.nativeEvent]
    for (const ev of eventos) {
      const p = punto(ev)
      if (lejos(tr.puntos[tr.puntos.length - 1], p)) tr.puntos.push(p)
    }
    pintar()
  }
  const subir = (e) => {
    const tr = trazo.current
    if (!tr || e.pointerId !== tr.pointerId) return
    terminar(tr)
    setEnCurso(comoSeVe(tr, tr.puntos))
    /* El trazo queda dibujado arriba hasta que vuelve de la base y se suma a
       los de abajo: así no parpadea. */
  }
  useEffect(() => { if (!trazo.current) setEnCurso(null) }, [trazosRaw])

  const deshacer = () => {
    const id = ultimoTrazo(trazosRaw)
    if (id) store.remove(`${ruta}/paginas/${vista.pagina}/trazos/${id}`)
  }
  const limpiar = () => {
    if (trazos.length && confirm(t('confirmarLimpiar'))) store.remove(`${ruta}/paginas/${vista.pagina}`)
  }
  const irA = (pagina) => cambiarVista({ pagina })
  const nueva = () => cambiarVista({ paginas: vista.paginas + 1, pagina: vista.paginas })
  const proyectar = () => store.update(`${raiz(pin)}/estado`, { pizarra: !proyectando })

  const boton = 'h-11 min-w-11 px-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40'
  const activo = '!border-teal-600 !bg-teal-50 !text-teal-800'

  return (
    <div className="h-[100dvh] flex flex-col select-none">
      <header className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-white border-b border-slate-200">
        <div role="group" aria-label={t('lapiz')} className="flex items-center gap-1.5">
          {COLORES.map(c => (
            <button key={c.id} onClick={() => { setColor(c.hex); setBorrador(false) }} aria-label={t(`color_${c.id}`)}
              aria-pressed={!borrador && color === c.hex}
              className={`w-10 h-10 rounded-full border-4 ${!borrador && color === c.hex ? 'border-teal-500' : 'border-transparent'}`}
              style={{ backgroundColor: c.hex }} />
          ))}
        </div>
        <span className="w-px h-8 bg-slate-200" />
        {GROSORES.map((g, i) => (
          <button key={g} onClick={() => { setGrosor(g); setBorrador(false) }} aria-pressed={!borrador && grosor === g}
            aria-label={t(i ? 'grosorGrueso' : 'grosorFino')} className={`${boton} ${!borrador && grosor === g ? activo : ''}`}>
            <span className="block rounded-full bg-current mx-auto" style={{ width: 22, height: i ? 9 : 4 }} />
          </button>
        ))}
        <button onClick={() => setBorrador(b => !b)} aria-pressed={borrador} className={`${boton} ${borrador ? activo : ''}`}>{t('borrador')}</button>
        <button onClick={deshacer} disabled={!trazos.length} className={boton}>↶ {t('deshacer')}</button>
        <button onClick={limpiar} disabled={!trazos.length} className={boton}>{t('limpiar')}</button>
        <span className="w-px h-8 bg-slate-200" />
        <select value={vista.fondo} onChange={(e) => cambiarVista({ fondo: e.target.value })} aria-label={t('papel')}
          className="h-11 rounded-xl border border-slate-300 bg-white px-2 font-semibold text-slate-700">
          {FONDOS_PIZARRA.map(f => <option key={f} value={f}>{t(`papel_${f}`)}</option>)}
        </select>
        <span className="flex-1" />
        <button onClick={() => irA(vista.pagina - 1)} disabled={vista.pagina === 0} aria-label={t('paginaAnterior')} className={boton}>‹</button>
        <span className="text-sm font-bold text-slate-700 tabular-nums" aria-label={t('paginaDe', vista.pagina + 1, vista.paginas)}>{vista.pagina + 1}/{vista.paginas}</span>
        {vista.pagina < vista.paginas - 1
          ? <button onClick={() => irA(vista.pagina + 1)} aria-label={t('paginaSiguiente')} className={boton}>›</button>
          : <button onClick={nueva} disabled={vista.paginas >= MAX_PAGINAS} className={boton}>+ {t('pagina')}</button>}
        <button onClick={proyectar}
          className={`h-11 px-4 rounded-xl font-bold ${proyectando ? 'bg-teal-700 text-white' : 'border-2 border-teal-700 text-teal-800 bg-white'}`}>
          {proyectando ? `● ${t('proyectando')}` : t('proyectarPizarra')}
        </button>
      </header>

      <Lienzo trazos={trazos} enCurso={enCurso} fondo={vista.fondo} papelRef={papel} className="flex-1 p-3"
        onPointerDown={bajar} onPointerMove={mover} onPointerUp={subir} onPointerCancel={subir}
        onContextMenu={(e) => e.preventDefault()} />
    </div>
  )
}
