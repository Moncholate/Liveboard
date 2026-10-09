/* ============================================================================
   LO QUE LLEGA DEL TOOLBOX
   ----------------------------------------------------------------------------
   Las herramientas de cierre de Teacher's Toolbox, y su crucigrama,
   funcionan sin internet. Su botón «Hacer con celulares» abre ESTA app con lo
   que el docente ya escribió (el objetivo, el molde, las consignas, el
   crucigrama armado), para que el curso responda desde el celular:

     #/host?cargar=<JSON en base64url>      { v: 1, actividad: { tipo, … } }

   Va en el enlace y no en una base de datos porque así el Belt sigue sin
   servidor: no guarda nada, solo abre una pestaña. Son las preguntas del
   docente, nunca datos de estudiantes.

   La copia de `codificar` vive en el Belt (src/celulares.js): si cambia el
   formato, se cambian las dos y se sube `v`.

   Este archivo es PURO para poder probarlo (cierres.test.js).
   ========================================================================== */
import { DESDE_BELT, idAlAzar, limpiarActividad, problemaDe } from './logic.js'

export const VERSION = 1

/** JSON → base64url, en UTF-8 (las tildes no caben en btoa a secas). */
export const codificar = (obj) => {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const decodificar = (s) => {
  const b64 = String(s).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))))
}

/**
 * Lee el enlace. Devuelve null si no trae nada, `{ actividad }` lista para la
 * sala (limpia y con id nuevo), o `{ error: true }` si viene rota: mejor
 * decirlo que abrir la sala como si nada.
 */
export const leerTraida = (hash, azar = Math.random) => {
  const cargar = new URLSearchParams(String(hash || '').split('?')[1] || '').get('cargar')
  if (!cargar) return null
  try {
    const { v, actividad } = decodificar(cargar)
    if (v !== VERSION || !DESDE_BELT.includes(actividad?.tipo)) return { error: true }
    const limpia = limpiarActividad({ ...actividad, id: idAlAzar(azar) })
    return problemaDe(limpia) ? { error: true } : { actividad: limpia }
  } catch {
    return { error: true }
  }
}
