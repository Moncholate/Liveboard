/* ============================================================================
   LA SALA EN LA BASE DE DATOS
   ----------------------------------------------------------------------------
   boards/{pin}/
     meta          { creada, clave }   clave = la del enlace para moderar
     estado        { idx, abierta, resultados }
                   idx null = preparando (sala de espera); si no, la actividad
                   que se está mostrando
     actividades   [ { id, tipo, pregunta, alternativas? } ]
     participantes { pid: { nombre, at } }
     online        { pid: true | false }
     respuestas    { aid: { pid: { palabras | opcion | valor | texto, at } } }
     moderacion    { aid: { palabras: { clave: 'ocultar' | 'mostrar' },
                            abiertas: { pid: true | false } } }

   Las respuestas van bajo el id de la actividad (aid) y no bajo su posición:
   si el docente reordena o borra una, cada respuesta sigue con su pregunta.

   Las acciones del docente viven aquí y no en una pantalla porque las usan dos:
   el proyector y el celular con que se modera. Dos copias de «siguiente»
   terminan haciendo cosas distintas.
   ========================================================================== */
import { limpiarActividad } from './logic.js'

export const raiz = (pin) => `boards/${pin}`

export const accionesDeSala = (store, pin) => {
  const base = raiz(pin)
  /* Cada actividad arranca abierta y con los resultados a la vista. */
  const mostrar = (idx) => store.set(`${base}/estado`, { idx, abierta: true, resultados: true })
  return {
    mostrar,
    volverAPreparar: () => store.set(`${base}/estado`, { idx: null, abierta: false, resultados: false }),
    abrir: (abierta) => store.update(`${base}/estado`, { abierta }),
    resultados: (resultados) => store.update(`${base}/estado`, { resultados }),
    guardarActividades: (lista) => store.set(`${base}/actividades`, lista.map(limpiarActividad)),
    moderarPalabra: (aid, clave, decision) => store.set(`${base}/moderacion/${aid}/palabras/${clave}`, decision),
    decidirAbierta: (aid, pid, decision) => store.set(`${base}/moderacion/${aid}/abiertas/${pid}`, decision),
    cerrarSala: () => store.remove(base),
  }
}

export const conectados = (online) => Object.values(online || {}).filter(Boolean).length

/* Firebase guarda los arreglos como objetos con claves numéricas cuando les
   falta algún índice, y no guarda los vacíos. Esto devuelve siempre un arreglo. */
export const comoLista = (x) => (Array.isArray(x) ? x.filter(Boolean) : Object.values(x || {}))
