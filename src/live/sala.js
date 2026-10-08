/* ============================================================================
   LA SALA EN LA BASE DE DATOS
   ----------------------------------------------------------------------------
   boards/{pin}/
     meta          { creada, clave }   clave = la del enlace para moderar
     idioma        'es' | 'en'   lo siguen el proyector y todos los celulares
     estado        { idx, abierta, resultados, pizarra? }
                   idx null = preparando (sala de espera); si no, la actividad
                   que se está mostrando. pizarra = el proyector muestra el
                   pizarrón encima (pizarra.js); cambiar de actividad lo aparta
     pizarra       lo que escribe el docente en su tablet (pizarra.js)
     actividades   [ { id, tipo, pregunta, alternativas? } ]
     participantes { pid: { nombre, at } }
     online        { pid: true | false }
     respuestas    { aid: { pid: { palabras | opcion | valor | texto | orden, at } } }
                   en «preguntas» cada uno guarda las suyas y sus votos:
                   { preguntas: { qid: { texto, at } }, votos: { qid: true }, at }
                   y reescribe el nodo entero, porque las reglas piden que `at`
                   sea la hora del servidor en cada escritura
     moderacion    { aid: { palabras: { clave: 'ocultar' | 'mostrar' },
                            abiertas: { pid: true | false },
                            correcciones: { pid: { texto, de } },
                            preguntas: { qid: true | false },
                            respondidas: { qid: true },
                            correccionesPreguntas: { qid: { texto, de } },
                            correccionesNube: { clave escrita: texto },
                            verCorrecciones: false? } }
                   (la corrección del docente; `de` = el texto que corrigió,
                   para que caduque sola si el estudiante cambia el suyo.
                   verCorrecciones = false si el curso ve solo la versión
                   limpia; si no está, ve qué se corrigió)

   Las respuestas van bajo el id de la actividad (aid) y no bajo su posición:
   si el docente reordena o borra una, cada respuesta sigue con su pregunta.

   Las acciones del docente viven aquí y no en una pantalla porque las usan dos:
   el proyector y el celular con que se modera. Dos copias de «siguiente»
   terminan haciendo cosas distintas.
   ========================================================================== */
import { claveDePalabra, limpiarAbierta, limpiarActividad, limpiarPalabra } from './logic.js'

export const raiz = (pin) => `boards/${pin}`

export const accionesDeSala = (store, pin) => {
  const base = raiz(pin)
  const corregirTexto = (ruta, texto, de) => {
    const limpio = limpiarAbierta(texto)
    return limpio && limpio !== limpiarAbierta(de) ? store.set(ruta, { texto: limpio, de: limpiarAbierta(de) }) : store.remove(ruta)
  }
  /* Cada actividad arranca abierta y con los resultados a la vista. */
  const mostrar = (idx) => store.set(`${base}/estado`, { idx, abierta: true, resultados: true })
  return {
    mostrar,
    volverAPreparar: () => store.set(`${base}/estado`, { idx: null, abierta: false, resultados: false }),
    abrir: (abierta) => store.update(`${base}/estado`, { abierta }),
    pizarra: (si) => store.update(`${base}/estado`, { pizarra: si ? true : null }),
    resultados: (resultados) => store.update(`${base}/estado`, { resultados }),
    guardarActividades: (lista) => store.set(`${base}/actividades`, lista.map(limpiarActividad)),
    cambiarIdioma: (idioma) => store.set(`${base}/idioma`, idioma === 'en' ? 'en' : 'es'),
    moderarPalabra: (aid, clave, decision) => store.set(`${base}/moderacion/${aid}/palabras/${clave}`, decision),
    decidirAbierta: (aid, pid, decision) => store.set(`${base}/moderacion/${aid}/abiertas/${pid}`, decision),
    /* Sin texto, se quita la corrección y vuelve a verse el original. */
    corregirAbierta: (aid, pid, texto, de) => corregirTexto(`${base}/moderacion/${aid}/correcciones/${pid}`, texto, de),
    corregirPregunta: (aid, qid, texto, de) => corregirTexto(`${base}/moderacion/${aid}/correccionesPreguntas/${qid}`, texto, de),
    /* Una palabra de la nube puede venir de varias escritas («beatifull»,
       «beautifull»): la corrección se anota para todas. Sin texto, se quita. */
    corregirPalabra: (aid, origenes, texto) => {
      const limpio = limpiarPalabra(texto)
      /* Ojo: «cancion» → «canción» es la misma clave y vale igual (la tilde). */
      const cambios = Object.fromEntries(origenes.map(c => [c, limpio && claveDePalabra(limpio) ? limpio : null]))
      return store.update(`${base}/moderacion/${aid}/correccionesNube`, cambios)
    },
    verCorrecciones: (aid, si) => store.set(`${base}/moderacion/${aid}/verCorrecciones`, si ? null : false),
    decidirPregunta: (aid, qid, decision) => store.set(`${base}/moderacion/${aid}/preguntas/${qid}`, decision),
    marcarRespondida: (aid, qid, si) => store.set(`${base}/moderacion/${aid}/respondidas/${qid}`, si ? true : null),
    cerrarSala: () => store.remove(base),
  }
}

export const conectados = (online) => Object.values(online || {}).filter(Boolean).length

/* Firebase guarda los arreglos como objetos con claves numéricas cuando les
   falta algún índice, y no guarda los vacíos. Esto devuelve siempre un arreglo. */
export const comoLista = (x) => (Array.isArray(x) ? x.filter(Boolean) : Object.values(x || {}))
