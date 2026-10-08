import { describe, expect, it } from 'vitest'
import {
  ALTO, ANCHO, COLORES, LARGO_MAX, aLaVista, fondoEscrito, yValida, GROSOR_BORRADOR, MAX_PAGINAS, botonDeBorrar, botonEnElAire, codificar, decodificar, enCursoVisible, idDeTrazo, lejos,
  trazosEnOrden, ultimoTrazo, unirPartes, vistaValida,
} from './pizarra.js'
import { TEXTOS } from '../i18n.jsx'

describe('puntos del pizarrón', () => {
  it('viajan como texto corto, redondeados y dentro del papel', () => {
    expect(codificar([[10.4, 20.6], [-5, 2000]])).toBe('10,21 0,2000')
    expect(codificar([[0, LARGO_MAX + 50]])).toBe(`0,${LARGO_MAX}`)
    expect(decodificar('10,21 0,900')).toEqual([[10, 21], [0, 900]])
    expect(codificar([[ANCHO + 1, 0]])).toBe(`${ANCHO},0`)
  })

  it('lo que no se entiende se salta', () => {
    expect(decodificar('1,2 basura 3,4')).toEqual([[1, 2], [3, 4]])
    expect(decodificar(null)).toEqual([])
  })

  it('un punto casi encima del anterior no se guarda', () => {
    expect(lejos([0, 0], [1, 1])).toBe(false)
    expect(lejos([0, 0], [3, 0])).toBe(true)
    expect(lejos(undefined, [0, 0])).toBe(true)
  })

  it('las partes de un trazo en curso se juntan en orden, aunque lleguen como objeto', () => {
    expect(unirPartes({ 10: '5,5', 2: '3,3', 0: '1,1' })).toBe('1,1 3,3 5,5')
    expect(unirPartes(['1,1', '2,2'])).toBe('1,1 2,2')
  })
})

describe('botón del lápiz', () => {
  it('con el botón lateral apretado, el lápiz borra', () => {
    expect(botonDeBorrar({ pointerType: 'pen', buttons: 3, button: 0 })).toBe(true)
    expect(botonDeBorrar({ pointerType: 'pen', buttons: 1, button: 2 })).toBe(true)
    expect(botonDeBorrar({ pointerType: 'pen', buttons: 32, button: 5 })).toBe(true)
  })

  it('el S Pen de la Tab S9: moverse «con clic» y sin presión es el botón', () => {
    expect(botonEnElAire({ type: 'pointermove', pointerType: 'pen', buttons: 1, pressure: 0 })).toBe(true)
    expect(botonEnElAire({ type: 'pointermove', pointerType: 'pen', buttons: 1, pressure: 0.2 })).toBe(false)
    expect(botonEnElAire({ type: 'pointermove', pointerType: 'pen', buttons: 0, pressure: 0 })).toBe(false)
    expect(botonEnElAire({ type: 'pointermove', pointerType: 'mouse', buttons: 1, pressure: 0 })).toBe(false)
    expect(botonEnElAire({ type: 'pointerup', pointerType: 'pen', buttons: 1, pressure: 0 })).toBe(false)
  })

  it('sin botón escribe, y el botón derecho del mouse o un dedo no borran', () => {
    expect(botonDeBorrar({ pointerType: 'pen', buttons: 1, button: 0 })).toBe(false)
    expect(botonDeBorrar({ pointerType: 'mouse', buttons: 2, button: 2 })).toBe(false)
    expect(botonDeBorrar({ pointerType: 'touch', buttons: 1, button: 0 })).toBe(false)
  })
})

describe('trazos', () => {
  it('el id se ordena por hora, así deshacer quita el último', () => {
    const a = idDeTrazo(1000, () => 0.9)
    const b = idDeTrazo(2000, () => 0)
    expect(a < b).toBe(true)
    expect(ultimoTrazo({ [b]: {}, [a]: {} })).toBe(b)
    expect(ultimoTrazo(null)).toBeNull()
  })

  it('se leen en orden, con color y grosor válidos, y el borrador es grueso', () => {
    const l = trazosEnOrden({
      b: { c: '#nada', g: 99, p: '1,1 2,2' },
      a: { c: COLORES[1].hex, g: 10, p: '0,0' },
      c: { b: true, p: '5,5' },
      d: { p: '' },
    })
    expect(l.map(t => t.id)).toEqual(['a', 'b', 'c'])
    expect(l[1]).toMatchObject({ color: COLORES[0].hex, grosor: 4 })
    expect(l[2]).toMatchObject({ borrador: true, grosor: GROSOR_BORRADOR })
  })

  it('el trazo en curso se ve solo en su página y mientras no esté guardado', () => {
    const e = { id: 't1', pg: 0, c: COLORES[2].hex, g: 10, partes: { 0: '1,1', 1: '2,2' } }
    expect(enCursoVisible(e, 0, {})).toMatchObject({ color: COLORES[2].hex, puntos: [[1, 1], [2, 2]] })
    expect(enCursoVisible(e, 1, {})).toBeNull()
    expect(enCursoVisible(e, 0, { t1: {} })).toBeNull()
    expect(enCursoVisible(null, 0, {})).toBeNull()
  })
})

describe('cuaderno hacia abajo', () => {
  it('no se sube más allá del principio ni se baja más allá del final', () => {
    expect(yValida(-30)).toBe(0)
    expect(yValida(LARGO_MAX * 2)).toBe(LARGO_MAX - ALTO)
    expect(yValida('nada')).toBe(0)
  })

  it('cada trazo sabe de qué alto a qué alto llega, y la página hasta dónde está escrita', () => {
    const l = trazosEnOrden({ a: { p: '0,100 5,300' }, b: { p: '0,2000 5,1800' } })
    expect(l.map(t => [t.yMin, t.yMax])).toEqual([[100, 300], [1800, 2000]])
    expect(fondoEscrito(l)).toBe(2000)
    expect(fondoEscrito([])).toBe(0)
  })

  it('solo se dibujan los trazos que caen en la ventana', () => {
    const t = { yMin: 1800, yMax: 2000, grosor: 4 }
    expect(aLaVista(t, 0)).toBe(false)
    expect(aLaVista(t, 1000)).toBe(true)
    expect(aLaVista(t, 2010)).toBe(false)
    expect(aLaVista(t, 2002)).toBe(true) // el grosor asoma en el borde
  })
})

describe('vista del pizarrón', () => {
  it('sin nada guardado, una página en blanco', () => {
    expect(vistaValida(null)).toEqual({ pagina: 0, paginas: 1, fondo: 'blanco', y: 0 })
  })

  it('la página no se sale del rango y hay un máximo de páginas', () => {
    expect(vistaValida({ pagina: 9, paginas: 3, fondo: 'cuadros', y: 450.6 })).toEqual({ pagina: 2, paginas: 3, fondo: 'cuadros', y: 451 })
    expect(vistaValida({ paginas: 999 }).paginas).toBe(MAX_PAGINAS)
    expect(vistaValida({ fondo: 'marciano' }).fondo).toBe('blanco')
  })

  it('cada color y cada papel tiene nombre en los dos idiomas', () => {
    for (const c of COLORES) expect(TEXTOS[`color_${c.id}`], c.id).toBeDefined()
    for (const f of ['blanco', 'cuadros', 'lineas']) expect(TEXTOS[`papel_${f}`], f).toBeDefined()
  })
})
