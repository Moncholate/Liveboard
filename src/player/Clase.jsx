/* ============================================================================
   LA CLASE PARA LLEVAR
   ----------------------------------------------------------------------------
   Lo que abre el enlace o el QR de «Compartir la clase»: la clase en limpio,
   para leerla en el celular, y el botón para descargarla en PDF. Sirve
   también para quienes faltaron (el docente pega el enlace en el aula
   virtual). Dura 30 días (resumen.js). Sin nombres.
   ========================================================================== */
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../net/hooks.js'
import { Button, Center, Logo } from '../ui.jsx'
import { ProveedorIdioma, idiomaDelNavegador, traducir, useT } from '../i18n.jsx'
import { ALTERNATIVAS } from '../live/logic.js'
import { rutaResumen } from '../live/resumen.js'
import { imagenesDePagina } from '../live/imagenPizarra.js'
import { useTema } from '../tema.jsx'

export default function Clase({ id }) {
  useTema()
  const store = useStore()
  const [resumen, setResumen] = useState(undefined)
  useEffect(() => {
    if (!store) return
    /* Vencido o inexistente, las reglas no dejan leerlo: da lo mismo cuál. */
    store.get(rutaResumen(id)).then(r => setResumen(r || null), () => setResumen(null))
  }, [store, id])

  const idioma = resumen?.idioma || idiomaDelNavegador()
  if (resumen === undefined) return <Center>{traducir(idioma, 'cargando')}</Center>
  if (resumen === null) return <Center>{traducir(idioma, 'claseNoDisponible')}</Center>
  return <ProveedorIdioma value={resumen.idioma === 'en' ? 'en' : 'es'}><Vista resumen={normalizar(resumen)} /></ProveedorIdioma>
}

/* Firebase devuelve los arreglos como objetos si les falta algo, y no guarda
   los vacíos: aquí todo vuelve a ser arreglo. */
const lista = (x) => (Array.isArray(x) ? x : Object.values(x || {}))
export const normalizar = (r) => ({
  ...r,
  actividades: lista(r.actividades).map(a => ({
    ...a,
    alternativas: lista(a.alternativas),
    votos: lista(a.votos),
    filas: lista(a.filas),
    palabras: lista(a.palabras),
    textos: lista(a.textos),
    preguntas: lista(a.preguntas),
  })),
  pizarra: { fondo: r.pizarra?.fondo || 'blanco', paginas: lista(r.pizarra?.paginas) },
})

export function BotonPdf({ resumen, className = '' }) {
  const t = useT()
  const [estado, setEstado] = useState(null) // null | 'armando' | 'error'
  const descargar = async () => {
    setEstado('armando')
    try {
      const { descargarPdf } = await import('../live/pdfClase.js')
      await descargarPdf(resumen)
      setEstado(null)
    } catch (e) {
      console.error(e)
      setEstado('error')
    }
  }
  return (
    <>
      <Button onClick={descargar} disabled={estado === 'armando'} className={className}>
        {estado === 'armando' ? t('armandoPdf') : `⤓ ${t('descargarPdf')}`}
      </Button>
      {estado === 'error' && <p role="alert" className="text-sm text-rose-700">{t('pdfError')}</p>}
    </>
  )
}

function Vista({ resumen }) {
  const t = useT()
  const fecha = new Date(resumen.creado).toLocaleDateString(t.idioma === 'en' ? 'en-US' : 'es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const vence = new Date(resumen.vence).toLocaleDateString(t.idioma === 'en' ? 'en-US' : 'es-CL', { day: 'numeric', month: 'long' })
  return (
    <div className="min-h-screen">
      <header className="px-4 py-3 bg-white border-b border-slate-200"><Logo className="text-xl" /></header>
      <main className="max-w-2xl mx-auto p-4 flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-slate-900">{t('claseDel', fecha)}</h1>
          <p className="text-sm text-slate-500">{t('pdfSubtitulo')} · {t('disponibleHasta', vence)}</p>
          <BotonPdf resumen={resumen} className="text-lg mt-1" />
        </section>
        {resumen.actividades.map((a, n) => <Actividad key={n} a={a} n={n} />)}
        {resumen.pizarra.paginas.map((p, n) => <PaginaPizarra key={n} pagina={p} fondo={resumen.pizarra.fondo} n={n} />)}
      </main>
    </div>
  )
}

function Actividad({ a, n }) {
  const t = useT()
  const numero = (x) => x.toLocaleString(t.idioma === 'en' ? 'en-US' : 'es-CL')
  const Barra = ({ pct, clase = 'bg-teal-600' }) => (
    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${clase}`} style={{ width: `${pct}%` }} /></div>
  )
  const Fila = ({ izq, der, pct, clase }) => (
    <div>
      <div className="flex justify-between gap-3 font-semibold text-slate-800"><span>{izq}</span><span className="shrink-0 tabular-nums text-slate-500">{der}</span></div>
      <Barra pct={pct} clase={clase} />
    </div>
  )
  let cuerpo = null
  if (a.tipo === 'nube') {
    cuerpo = <p className="flex flex-wrap gap-x-4 gap-y-1">{a.palabras.map((p, i) => <span key={i} className="font-bold text-slate-800">{p.texto} <span className="font-normal text-slate-500">({p.cuenta})</span></span>)}</p>
  } else if (a.tipo === 'encuesta') {
    const total = a.votos.reduce((s, v) => s + (v || 0), 0)
    cuerpo = a.alternativas.map((texto, i) => {
      const pct = total ? Math.round(((a.votos[i] || 0) / total) * 100) : 0
      return <Fila key={i} izq={`${ALTERNATIVAS[i].letra}. ${texto}`} der={`${a.votos[i] || 0} · ${pct}%`} pct={pct} clase={ALTERNATIVAS[i].solido} />
    })
  } else if (a.tipo === 'escala') {
    const max = Math.max(1, ...a.votos)
    cuerpo = (
      <>
        <p className="text-lg font-black text-slate-900">{t('promedio')}: {a.promedio == null ? '–' : numero(a.promedio)} / 5</p>
        {t('escala').map((r, i) => <Fila key={i} izq={`${i + 1} · ${r}`} der={a.votos[i] || 0} pct={((a.votos[i] || 0) / max) * 100} />)}
      </>
    )
  } else if (a.tipo === 'ranking') {
    const maximo = a.total * (a.alternativas.length - 1)
    cuerpo = a.filas.map(f => (
      <Fila key={f.i} izq={`${f.puesto}. ${a.alternativas[f.i]}`} der={f.promedio == null ? '' : t('puestoMedio', numero(f.promedio))} pct={maximo ? (f.puntos / maximo) * 100 : 0} />
    ))
  } else if (a.tipo === 'abierta') {
    cuerpo = a.textos.map((texto, i) => <p key={i} className="rounded-xl bg-white border border-slate-200 p-3 font-semibold text-slate-800 break-words">{texto}</p>)
  } else if (a.tipo === 'preguntas') {
    cuerpo = a.preguntas.map((q, i) => (
      <div key={i} className={`rounded-xl bg-white border border-slate-200 p-3 ${q.respondida ? 'opacity-70' : ''}`}>
        <p className="font-semibold text-slate-800 break-words">{q.texto}</p>
        <p className="text-xs text-slate-500 mt-1">{t('votosN', q.votos)}{q.respondida ? ` · ✓ ${t('respondida')}` : ''}</p>
      </div>
    ))
  }
  return (
    <section className="flex flex-col gap-2 border-t border-slate-200 pt-4">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-800">{n + 1}. {t(`tipo_${a.tipo}`)}</p>
      <h2 className="text-lg font-black text-slate-900 leading-snug">{a.pregunta}</h2>
      {cuerpo}
    </section>
  )
}

function PaginaPizarra({ pagina, fondo, n }) {
  const t = useT()
  const imagenes = useMemo(() => imagenesDePagina(pagina.trazos, fondo, 1600), [pagina, fondo])
  return (
    <section className="flex flex-col gap-2 border-t border-slate-200 pt-4">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-800">{t('pizarra')} · {t('pagina')} {n + 1}</p>
      {imagenes.map((src, i) => <img key={i} src={src} alt={`${t('pizarra')} ${n + 1}`} className="w-full rounded-xl border border-slate-200" />)}
    </section>
  )
}
