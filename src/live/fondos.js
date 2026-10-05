/* ============================================================================
   LOS FONDOS DEL PROYECTOR
   ----------------------------------------------------------------------------
   Colores y fondos hechos con CSS (degradados y patrones): no son archivos, así
   que no ocupan espacio en la base ni hay que subir nada. Subir una imagen
   propia queda para después, junto con la cuota de imágenes por docente.

   Se ven SOLO en el proyector y solo mientras se presenta una actividad: los
   celulares siguen simples. El contenido va siempre sobre un panel casi opaco,
   así que se lee sobre cualquier fondo; `oscuro` dice de qué color va lo poco
   que queda fuera del panel.

   Cada material guarda el id de su fondo, igual que su idioma.
   ========================================================================== */

export const FONDOS = [
  { id: 'ninguno', es: 'Sin fondo', en: 'No background', css: null, oscuro: false },

  // Colores sólidos
  { id: 'pizarra', es: 'Pizarra', en: 'Chalkboard', css: '#1f3b2d', oscuro: true },
  { id: 'medianoche', es: 'Medianoche', en: 'Midnight', css: '#111827', oscuro: true },
  { id: 'azul', es: 'Azul', en: 'Blue', css: '#1e3a8a', oscuro: true },
  { id: 'vino', es: 'Vino', en: 'Wine', css: '#7f1d1d', oscuro: true },
  { id: 'arena', es: 'Arena', en: 'Sand', css: '#fef3c7', oscuro: false },
  { id: 'menta', es: 'Menta', en: 'Mint', css: '#d1fae5', oscuro: false },
  { id: 'lavanda', es: 'Lavanda', en: 'Lavender', css: '#ede9fe', oscuro: false },
  { id: 'cielo', es: 'Cielo', en: 'Sky', css: '#e0f2fe', oscuro: false },

  // Degradados y patrones
  { id: 'amanecer', es: 'Amanecer', en: 'Sunrise', css: 'linear-gradient(135deg, #fde68a, #fca5a5 50%, #c4b5fd)', oscuro: false },
  { id: 'atardecer', es: 'Atardecer', en: 'Sunset', css: 'linear-gradient(135deg, #f97316, #db2777 50%, #7c3aed)', oscuro: true },
  { id: 'oceano', es: 'Océano', en: 'Ocean', css: 'linear-gradient(160deg, #0ea5e9, #1e3a8a)', oscuro: true },
  { id: 'bosque', es: 'Bosque', en: 'Forest', css: 'linear-gradient(160deg, #22c55e, #14532d)', oscuro: true },
  {
    id: 'cuaderno', es: 'Cuaderno', en: 'Notebook', oscuro: false,
    css: 'linear-gradient(90deg, transparent 72px, #fca5a5 72px, #fca5a5 74px, transparent 74px), repeating-linear-gradient(#fffdf5 0 31px, #bfdbfe 31px 32px)',
  },
  {
    id: 'cuadriculado', es: 'Cuadriculado', en: 'Grid paper', oscuro: false,
    css: 'linear-gradient(#dbe3ee 1px, transparent 1px) 0 0 / 28px 28px, linear-gradient(90deg, #dbe3ee 1px, transparent 1px) 0 0 / 28px 28px, #ffffff',
  },
  {
    id: 'estrellas', es: 'Noche estrellada', en: 'Starry night', oscuro: true,
    css: 'radial-gradient(#ffffff 1px, transparent 1.6px) 0 0 / 46px 46px, radial-gradient(#fde68a 1.2px, transparent 1.8px) 23px 23px / 46px 46px, linear-gradient(#0b1023, #1e1b4b)',
  },
  {
    id: 'confeti', es: 'Confeti', en: 'Confetti', oscuro: false,
    css: 'radial-gradient(#f472b6 2.5px, transparent 3px) 0 0 / 60px 60px, radial-gradient(#60a5fa 2.5px, transparent 3px) 20px 30px / 60px 60px, radial-gradient(#facc15 2.5px, transparent 3px) 40px 10px / 60px 60px, radial-gradient(#34d399 2.5px, transparent 3px) 10px 45px / 60px 60px, #ffffff',
  },
]

export const fondoPorId = (id) => FONDOS.find((f) => f.id === id) ?? FONDOS[0]

/** Un id que no existe (de una versión futura, o escrito a mano) cae en «sin fondo». */
export const fondoValido = (id) => fondoPorId(id).id
