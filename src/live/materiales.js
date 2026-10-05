/* ============================================================================
   MIS MATERIALES
   ----------------------------------------------------------------------------
   Lo que el docente prepara en casa y carga en clase con un clic. Vive en su
   cuenta, no en el computador del proyector:

     docentes/{uid}/liveboard/{id}   { nombre, idioma, fondo, actividades, actualizado }

   `docentes/{uid}` es del bundle entero: cada app guarda lo suyo en su propia
   rama (liveboard, y las que vengan), y las reglas dejan leer y escribir solo
   al dueño de la cuenta.

   Son las preguntas del docente, nunca datos de estudiantes.
   ========================================================================== */
import { idAlAzar, limpiarActividad } from './logic.js'
import { comoLista } from './sala.js'
import { fondoValido } from './fondos.js'

export const rutaMateriales = (uid) => `docentes/${uid}/liveboard`
export const rutaMaterial = (uid, id) => `${rutaMateriales(uid)}/${id}`

export const idMaterialNuevo = (azar = Math.random) => idAlAzar(azar)

/** Lo que se guarda: sin espacios de sobra, con el idioma, y con la hora del
    servidor (`stamp`) para ordenar la lista. */
export const materialParaGuardar = ({ nombre, idioma, fondo, actividades }, stamp) => ({
  nombre: String(nombre || '').replace(/\s+/g, ' ').trim().slice(0, 60),
  idioma: idioma === 'en' ? 'en' : 'es',
  fondo: fondoValido(fondo),
  actividades: comoLista(actividades).map(limpiarActividad),
  actualizado: stamp,
})

/** La lista para mostrar: el más reciente primero. */
export const listaDeMateriales = (raw) => Object.entries(raw || {})
  .map(([id, m]) => ({
    id,
    nombre: m?.nombre || '',
    idioma: m?.idioma === 'en' ? 'en' : 'es',
    fondo: fondoValido(m?.fondo),
    actividades: comoLista(m?.actividades),
    actualizado: typeof m?.actualizado === 'number' ? m.actualizado : 0,
  }))
  .sort((a, b) => b.actualizado - a.actualizado || a.nombre.localeCompare(b.nombre))

/** Al cargar un material en una sala, cada actividad recibe un id nuevo: si el
    mismo material se carga dos veces en la misma sala, las respuestas de la
    primera vez no se mezclan con las de la segunda. */
export const actividadesParaSala = (material, azar = Math.random) =>
  comoLista(material?.actividades).map(a => ({ ...a, id: idAlAzar(azar) }))
