/* ============================================================================
   EL RESUMEN DE LA CLASE
   ----------------------------------------------------------------------------
   Lo que el docente comparte al final: una copia de la clase para que los
   estudiantes se la lleven en PDF (pedido el 8-oct-2026: sacaban fotos al
   proyector). Se copia aparte porque la sala se borra al cerrarla.

     resumenes/{id}   { creado, vence, idioma, titulo?, objetivo?, actividades: [...], pizarra }
     boards/{pin}/resumen   id   el aviso a los celulares que están en la sala

   Va SIN NOMBRES, igual que el proyector: solo lo que el curso ya vio. De las
   abiertas y las preguntas, solo las aprobadas (con la corrección del docente);
   de la nube, solo las palabras visibles; del resto, los totales.

   Dura 15 días (el 8-oct-2026 el docente vio que se baja en la misma clase o
   nunca): las reglas no dejan leerlo después (database.rules.json), y
   el proyector borra los vencidos que creó en ese computador.
   ========================================================================== */
import { abiertas, conteoEncuesta, estadisticaEscala, idAlAzar, nube, preguntasDelCurso, resultadoRanking } from './logic.js'
import { comoLista } from './sala.js'
import { fondoPizarraValido } from './pizarra.js'
import { limpiarObjetivo, limpiarTitulo } from './materiales.js'

export const DIAS = 15
export const DURACION_MS = DIAS * 24 * 60 * 60 * 1000

export const rutaResumen = (id) => `resumenes/${id}`
export const idResumenNuevo = (azar = Math.random) => idAlAzar(azar)
export const urlResumen = (id) => `${location.origin}${location.pathname}#/clase?id=${id}`

/** Una actividad, ya resuelta: solo lo que se proyectó, sin quién respondió. */
export const resultadoDe = (a, respuestas, moderacion) => {
  const base = { tipo: a.tipo, pregunta: a.pregunta }
  switch (a.tipo) {
    case 'nube':
      return { ...base, palabras: nube(respuestas, moderacion?.palabras, moderacion?.correccionesNube).filter(p => !p.oculta).map(p => ({ texto: p.texto, cuenta: p.cuenta })) }
    case 'encuesta': {
      const alternativas = a.alternativas || []
      return { ...base, alternativas, votos: conteoEncuesta(respuestas, alternativas.length).votos }
    }
    case 'escala': {
      const { votos, promedio } = estadisticaEscala(respuestas)
      return { ...base, votos, promedio }
    }
    case 'ranking': {
      const alternativas = a.alternativas || []
      const { filas, total } = resultadoRanking(respuestas, alternativas.length)
      return { ...base, alternativas, total, filas: filas.map(f => ({ i: f.i, puesto: f.puesto, promedio: f.promedio, puntos: f.puntos })) }
    }
    case 'abierta':
      return { ...base, textos: abiertas(respuestas, moderacion?.abiertas, {}, moderacion?.correcciones).aprobadas.map(r => r.texto) }
    case 'preguntas':
      return { ...base, preguntas: preguntasDelCurso(respuestas, moderacion).aprobadas.map(q => ({ texto: q.texto, votos: q.votos, respondida: q.respondida })) }
    default:
      return null
  }
}

/** Una página de la pizarra vale la pena si tiene algo escrito. */
const paginasConAlgo = (pizarra) => {
  const fondo = fondoPizarraValido(pizarra?.vista?.fondo)
  const total = Math.max(1, pizarra?.vista?.paginas || 1)
  const paginas = []
  for (let i = 0; i < total; i++) {
    const trazos = pizarra?.paginas?.[i]?.trazos
    if (trazos && Object.keys(trazos).length) paginas.push({ trazos })
  }
  return { fondo, paginas }
}

/**
 * La copia de la sala para compartir. `sala` = el nodo boards/{pin} entero.
 * Las actividades sin ninguna respuesta no van: no hay nada que llevarse.
 */
export const armarResumen = (sala, ahora) => {
  const actividades = comoLista(sala?.actividades)
    .map(a => resultadoDe(a, sala?.respuestas?.[a.id], sala?.moderacion?.[a.id]))
    .filter(r => r && tieneAlgo(r))
  const titulo = limpiarTitulo(sala?.clase?.titulo)
  const objetivo = limpiarObjetivo(sala?.clase?.objetivo)
  return {
    creado: ahora,
    vence: ahora + DURACION_MS,
    idioma: sala?.idioma === 'en' ? 'en' : 'es',
    ...(titulo ? { titulo } : {}),
    ...(objetivo ? { objetivo } : {}),
    actividades,
    pizarra: paginasConAlgo(sala?.pizarra),
  }
}

export const tieneAlgo = (r) => {
  switch (r.tipo) {
    case 'nube': return r.palabras.length > 0
    case 'encuesta': case 'escala': return r.votos.some(v => v > 0)
    case 'ranking': return r.total > 0
    case 'abierta': return r.textos.length > 0
    case 'preguntas': return r.preguntas.length > 0
    default: return false
  }
}

export const resumenVacio = (r) => !r.actividades.length && !r.pizarra.paginas.length

/* ── Los que creó este computador, para borrarlos al vencer ────────────── */

const MIOS_KEY = 'liveboard-resumenes'
export const leerMios = () => { try { return JSON.parse(localStorage.getItem(MIOS_KEY)) || {} } catch { return {} } }
export const guardarMios = (m) => { try { localStorage.setItem(MIOS_KEY, JSON.stringify(m)) } catch { /* modo privado */ } }

/** Los ids ya vencidos de una lista { id: vence }. */
export const vencidos = (mios, ahora) => Object.entries(mios || {}).filter(([, v]) => v <= ahora).map(([id]) => id)
