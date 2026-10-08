/* ============================================================================
   LAS SALAS QUE QUEDARON ABIERTAS
   ----------------------------------------------------------------------------
   Una sala se borra con «Cerrar sala». Si el proyector se apaga sin eso, la
   sala queda en la base con apodos y respuestas: no se debe guardar más de lo
   necesario (Ley 21.719). Sin servidor (plan Spark), la limpia el mismo
   Liveboard (8-oct-2026):

     · cada computador anota las salas que abrió (localStorage);
     · con sesión de Google, también en la cuenta: docentes/{uid}/liveboardSalas
       { pin: creada }, para limpiarlas desde cualquier computador;
     · al abrir Liveboard, se borran las de más de 12 horas. Nunca la que está
       en uso.

   ANTES DE BORRAR se mira que la sala sea la misma (`meta.creada`): un PIN
   que se liberó puede tenerlo hoy la sala de otro docente.

   Una sala abierta en un computador que no se vuelve a usar, y sin sesión,
   queda hasta que se borre en la consola: cubrir eso pide un servidor.
   ========================================================================== */
import { raiz } from './sala.js'

export const VIDA_MS = 12 * 60 * 60 * 1000

const KEY = 'liveboard-salas'
export const leerSalas = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
const guardarSalas = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* modo privado */ } }

export const rutaSalasCuenta = (uid) => `docentes/${uid}/liveboardSalas`

/** ¿Pasaron más de 12 horas? Sin hora conocida, no se toca. */
export const esVieja = (creada, ahora) => typeof creada === 'number' && ahora - creada > VIDA_MS

/** Las de una lista { pin: creada } que ya hay que borrar, salvo la actual. */
export const viejas = (salas, ahora, actual = null) => Object.entries(salas || {})
  .filter(([pin, creada]) => pin !== actual && esVieja(creada, ahora))

/** Borra la sala solo si sigue siendo la que se abrió a esa hora. */
export async function borrarSiEsLaMisma(store, pin, creada) {
  const meta = await store.get(`${raiz(pin)}/meta`)
  if (meta && meta.creada === creada) await store.remove(raiz(pin))
}

export function anotarSala(store, pin, creada, uid = null) {
  if (typeof creada !== 'number') return
  guardarSalas({ ...leerSalas(), [pin]: creada })
  if (uid) store.set(`${rutaSalasCuenta(uid)}/${pin}`, creada).catch(() => {})
}

export function olvidarSala(store, pin, uid = null) {
  const s = leerSalas()
  delete s[pin]
  guardarSalas(s)
  if (uid) store.remove(`${rutaSalasCuenta(uid)}/${pin}`).catch(() => {})
}

/** Borra las viejas anotadas en este computador y, con `uid`, en la cuenta. */
export async function limpiarSalasViejas(store, { actual = null, uid = null } = {}) {
  const ahora = store.now()
  const locales = leerSalas()
  for (const [pin, creada] of viejas(locales, ahora, actual)) {
    await borrarSiEsLaMisma(store, pin, creada).catch(() => {})
    delete locales[pin]
  }
  guardarSalas(locales)
  if (!uid) return
  const enCuenta = await store.get(rutaSalasCuenta(uid)).catch(() => null)
  for (const [pin, creada] of viejas(enCuenta, ahora, actual)) {
    await borrarSiEsLaMisma(store, pin, creada).catch(() => {})
    await store.remove(`${rutaSalasCuenta(uid)}/${pin}`).catch(() => {})
  }
}
