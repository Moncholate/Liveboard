import { describe, expect, it } from 'vitest'
import { DURACION_MS, armarResumen, resumenVacio, vencidos } from './resumen.js'
import { nombreArchivo, textoParaPdf } from './pdfClase.js'

const sala = {
  idioma: 'en',
  actividades: [
    { id: 'a1', tipo: 'abierta', pregunta: 'What did you do?' },
    { id: 'a2', tipo: 'encuesta', pregunta: '¿Cuál?', alternativas: ['Sí', 'No'] },
    { id: 'a3', tipo: 'nube', pregunta: 'Una palabra' },
    { id: 'a4', tipo: 'escala', pregunta: 'Sin respuestas' },
    { id: 'a5', tipo: 'preguntas', pregunta: '¿Dudas?' },
    { id: 'a6', tipo: 'ranking', pregunta: 'Ordena', alternativas: ['x', 'y', 'z'] },
  ],
  participantes: { p1: { nombre: 'Ana' }, p2: { nombre: 'Beto' } },
  respuestas: {
    a1: { p1: { texto: 'I go to the park', at: 1 }, p2: { texto: 'secreto', at: 2 } },
    a2: { p1: { opcion: 0 }, p2: { opcion: 0 } },
    a3: { p1: { palabras: ['sol', 'weón'] } },
    a5: { p1: { preguntas: { q1: { texto: '¿Entra en la prueba?', at: 1 }, q2: { texto: 'no aprobada', at: 2 } } }, p2: { votos: { q1: true } } },
    a6: { p1: { orden: [2, 0, 1] } },
  },
  moderacion: {
    a1: { abiertas: { p1: true, p2: false }, correcciones: { p1: { texto: 'I went to the park.', de: 'I go to the park' } } },
    a5: { preguntas: { q1: true }, respondidas: { q1: true } },
  },
  pizarra: { vista: { paginas: 3, fondo: 'cuadros' }, paginas: { 0: { trazos: { t1: { c: '#1e293b', g: 4, p: '1,1 5,5' } } }, 2: { trazos: {} } } },
}

describe('el resumen de la clase', () => {
  const r = armarResumen(sala, 1000)

  it('no lleva ningún nombre ni id de estudiante', () => {
    const json = JSON.stringify(r)
    for (const x of ['Ana', 'Beto', 'p1', 'p2']) expect(json, x).not.toContain(x)
  })

  it('de las abiertas, solo las aprobadas y ya corregidas', () => {
    const a = r.actividades.find(x => x.tipo === 'abierta')
    expect(a.textos).toEqual(['I went to the park.'])
  })

  it('de la nube, solo lo visible (la grosería oculta no va)', () => {
    expect(r.actividades.find(x => x.tipo === 'nube').palabras).toEqual([{ texto: 'sol', cuenta: 1 }])
  })

  it('de las preguntas, solo las aprobadas, con votos y si se respondió', () => {
    expect(r.actividades.find(x => x.tipo === 'preguntas').preguntas).toEqual([{ texto: '¿Entra en la prueba?', votos: 1, respondida: true }])
  })

  it('las actividades sin respuestas no van, y el orden de la clase se mantiene', () => {
    expect(r.actividades.map(x => x.tipo)).toEqual(['abierta', 'encuesta', 'nube', 'preguntas', 'ranking'])
    expect(r.actividades.find(x => x.tipo === 'encuesta').votos).toEqual([2, 0])
  })

  it('de la pizarra, solo las páginas con algo escrito', () => {
    expect(r.pizarra.fondo).toBe('cuadros')
    expect(r.pizarra.paginas).toHaveLength(1)
  })

  it('dura 15 días y guarda el idioma de la sala', () => {
    expect(r.vence - r.creado).toBe(DURACION_MS)
    expect(r.idioma).toBe('en')
  })

  it('una sala sin nada no se comparte', () => {
    expect(resumenVacio(armarResumen({ actividades: [{ id: 'a', tipo: 'nube', pregunta: 'x' }] }, 1))).toBe(true)
    expect(resumenVacio(r)).toBe(false)
  })

  it('sabe cuáles de los suyos ya vencieron', () => {
    expect(vencidos({ a: 5, b: 50 }, 10)).toEqual(['a'])
  })
})

describe('el PDF', () => {
  it('cambia los signos que la letra del PDF no tiene y quita los emojis', () => {
    expect(textoParaPdf('“Hola” – ¿qué tal? ñandú… 👍')).toBe('"Hola" - ¿qué tal? ñandú... ')
  })

  it('el archivo lleva la fecha de la clase', () => {
    expect(nombreArchivo(new Date(2026, 9, 8, 15).getTime())).toBe('clase-2026-10-08.pdf')
  })
})
