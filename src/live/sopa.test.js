import { describe, expect, it } from 'vitest'
import { limpiarActividad, problemaDe } from './logic.js'
import { porDestapar, progreso, umbral } from './crucigrama.js'
import { casillasSopa, claveSopa, destapables, filasDe, palabraEntre, palabrasSopa } from './sopa.js'
import { armarResumen } from './resumen.js'
import { codificar, leerTraida } from './traida.js'

/* CAT → en la fila 0, DOG ↓ en la columna 3, SUN ↘ desde (1,0). */
const SOPA = {
  tipo: 'sopa', pregunta: '', lado: 4,
  filas: ['CATD', 'SXZO', 'QUWG', 'RTNE'],
  palabras: [
    { palabra: 'CAT', original: 'cat', fila: 0, col: 0, df: 0, dc: 1 },
    { palabra: 'DOG', original: 'dog', fila: 0, col: 3, df: 1, dc: 0 },
    { palabra: 'SUN', original: 'sun', fila: 1, col: 0, df: 1, dc: 1 },
  ],
}

describe('la sopa que llega del Belt', () => {
  it('se guarda limpia, con «la mitad» por defecto', () => {
    const a = limpiarActividad({ ...SOPA, id: 'x' })
    expect(a).toMatchObject({ lado: 4, destapar: 'mitad' })
    expect(a.palabras.map(claveSopa)).toEqual(['CAT', 'DOG', 'SUN'])
    expect(problemaDe(a)).toBeNull()
  })

  it('descarta una palabra que no está de verdad en la cuadrícula', () => {
    const p = palabrasSopa({ ...SOPA, palabras: [...SOPA.palabras, { palabra: 'CAR', fila: 0, col: 0, df: 0, dc: 1 }] })
    expect(p.map(claveSopa)).toEqual(['CAT', 'DOG', 'SUN'])
  })

  it('filas de otro largo que el lado: no hay sopa', () => {
    expect(filasDe({ lado: 4, filas: ['ABC', 'ABCD', 'ABCD', 'ABCD'] })).toEqual([])
    expect(problemaDe({ tipo: 'sopa', lado: 4, filas: ['ABC'], palabras: SOPA.palabras })).toBe('prob_sinSopa')
  })

  it('llega por el enlace del Belt', () => {
    const r = leerTraida(`#/host?cargar=${codificar({ v: 1, actividad: SOPA })}`)
    expect(r.actividad).toMatchObject({ tipo: 'sopa', lado: 4 })
  })
})

describe('encontrar una palabra tocando la primera y la última letra', () => {
  const palabras = palabrasSopa(SOPA)

  it('en los dos sentidos, también en diagonal', () => {
    expect(palabraEntre(palabras, { fila: 0, col: 0 }, { fila: 0, col: 2 })?.palabra).toBe('CAT')
    expect(palabraEntre(palabras, { fila: 2, col: 3 }, { fila: 0, col: 3 })?.palabra).toBe('DOG')
    expect(palabraEntre(palabras, { fila: 1, col: 0 }, { fila: 3, col: 2 })?.palabra).toBe('SUN')
  })

  it('un tramo que no es una palabra, o que no es recto, no encuentra nada', () => {
    expect(palabraEntre(palabras, { fila: 0, col: 0 }, { fila: 0, col: 1 })).toBeNull()
    expect(palabraEntre(palabras, { fila: 0, col: 0 }, { fila: 2, col: 1 })).toBeNull()
  })

  it('las casillas de una palabra en diagonal', () => {
    expect(casillasSopa(palabras[2])).toEqual(['1,0', '2,1', '3,2'])
  })
})

describe('cuándo aparece una palabra en la pantalla', () => {
  const { palabras, clave } = destapables(SOPA)
  const respuestas = { a: { bien: { CAT: true, DOG: true, SUN: true } }, b: { bien: { CAT: true } } }

  it('se cuenta igual que el crucigrama, con la palabra como clave', () => {
    expect(progreso(respuestas, palabras, clave)).toEqual({ por: { CAT: 2, DOG: 1, SUN: 1 }, terminaron: 1 })
    expect(porDestapar(palabras, progreso(respuestas, palabras, clave).por, umbral('mitad', 4), {}, clave)).toEqual(['CAT'])
  })

  it('en el resumen, cuántos encontraron cada una', () => {
    const r = armarResumen({ actividades: [{ ...SOPA, id: 's' }], respuestas: { s: respuestas } }, 0)
    expect(r.actividades[0].palabras).toEqual([
      { original: 'cat', encontraron: 2 }, { original: 'dog', encontraron: 1 }, { original: 'sun', encontraron: 1 },
    ])
  })
})
