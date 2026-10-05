/* ============================================================================
   ESPAÑOL E INGLÉS
   ----------------------------------------------------------------------------
   El idioma es de la SALA, no de cada pantalla: lo elige el docente al
   preparar y lo siguen el proyector, los celulares de los estudiantes y el
   celular del docente. En una clase de inglés todo queda en inglés; en
   cualquier otra, en español. Antes de entrar a una sala (inicio, entrada,
   mis materiales) se usa el idioma del navegador, y se puede cambiar.

   Cada texto vive aquí con sus dos versiones, una al lado de la otra: así es
   difícil agregar uno y olvidar el otro (logic.test.js lo revisa igual).
   Los textos con datos son funciones.
   ========================================================================== */
import { createContext, useContext } from 'react'

export const IDIOMAS = ['es', 'en']

export const TEXTOS = {
  // General
  lema: { es: 'La pizarra en vivo de tu clase', en: 'Your class’s live board' },
  pin: { es: 'PIN', en: 'PIN' },
  pinSala: { es: 'PIN de la sala', en: 'Room PIN' },
  entrar: { es: 'Entrar', en: 'Join' },
  soyProfe: { es: 'Soy profesor/a · abrir una sala', en: 'I’m a teacher · open a room' },
  misMateriales: { es: 'Mis materiales', en: 'My materials' },
  cargando: { es: 'Cargando…', en: 'Loading…' },
  conectados: { es: (n) => `${n} conectados`, en: (n) => `${n} connected` },
  modoLocal: { es: 'Modo local · solo este navegador', en: 'Local mode · this browser only' },

  // Tipos de actividad
  tipo_nube: { es: 'Nube de palabras', en: 'Word cloud' },
  tipo_encuesta: { es: 'Encuesta', en: 'Poll' },
  tipo_escala: { es: 'Escala 1–5', en: 'Scale 1–5' },
  tipo_abierta: { es: 'Respuesta abierta', en: 'Open answer' },
  ayuda_nube: { es: 'Cada estudiante escribe hasta 3 palabras. Las que más se repiten salen más grandes.', en: 'Each student writes up to 3 words. The most repeated ones show up bigger.' },
  ayuda_encuesta: { es: 'De 2 a 4 alternativas. Se ve cuántos eligieron cada una.', en: 'From 2 to 4 options. It shows how many chose each one.' },
  ayuda_escala: { es: 'Para medir: qué tan seguro te sientes, cuánto te gustó, qué tan difícil fue.', en: 'To measure: how confident you feel, how much you liked it, how hard it was.' },
  ayuda_abierta: { es: 'Una respuesta corta. Solo se proyectan las que apruebas.', en: 'A short answer. Only the ones you approve are shown.' },
  escala: { es: ['Nada', 'Poco', 'Más o menos', 'Bastante', 'Mucho'], en: ['Not at all', 'A little', 'Somewhat', 'Quite', 'Very much'] },

  // Problemas al preparar
  prob_sinTipo: { es: 'Elige un tipo de actividad.', en: 'Choose an activity type.' },
  prob_sinPregunta: { es: 'Falta la pregunta.', en: 'The question is missing.' },
  prob_pocasAlternativas: { es: 'La encuesta necesita al menos 2 alternativas.', en: 'The poll needs at least 2 options.' },

  // Proyector · preparar
  creandoSala: { es: 'Creando la sala…', en: 'Creating the room…' },
  noSeCreo: { es: (m) => `No se pudo crear la sala: ${m}`, en: (m) => `The room could not be created: ${m}` },
  cerrarSala: { es: 'Cerrar sala', en: 'Close room' },
  confirmarCerrar: { es: '¿Cerrar la sala? Se borran las respuestas y los estudiantes salen.', en: 'Close the room? All answers are deleted and students leave.' },
  actividades: { es: 'Actividades', en: 'Activities' },
  empezar: { es: 'Empezar', en: 'Start' },
  agregar: { es: 'Agregar', en: 'Add' },
  subir: { es: 'Subir', en: 'Move up' },
  bajar: { es: 'Bajar', en: 'Move down' },
  quitar: { es: 'Quitar', en: 'Remove' },
  escribePregunta: { es: 'Escribe la pregunta', en: 'Type the question' },
  alternativa: { es: (l) => `Alternativa ${l}`, en: (l) => `Option ${l}` },
  quitarAlternativa: { es: (l) => `Quitar alternativa ${l}`, en: (l) => `Remove option ${l}` },
  masAlternativa: { es: '+ Alternativa', en: '+ Option' },
  mostrarEsta: { es: 'Mostrar esta', en: 'Show this one' },
  escaneaParaEntrar: { es: 'Escanea para entrar', en: 'Scan to join' },
  qrEntrar: { es: 'Código QR para entrar a la sala', en: 'QR code to join the room' },
  oEntraA: { es: 'o entra a', en: 'or go to' },
  conElPin: { es: 'con el PIN', en: 'with the PIN' },
  idiomaSala: { es: 'Idioma de la sala', en: 'Room language' },
  idiomaAyuda: { es: 'Lo ven el proyector y los celulares.', en: 'Used on the projector and on phones.' },

  // Proyector · presentar
  deTotal: { es: (i, n) => `${i} de ${n}`, en: (i, n) => `${i} of ${n}` },
  respuestaN: { es: (n) => (n === 1 ? 'respuesta' : 'respuestas'), en: (n) => (n === 1 ? 'answer' : 'answers') },
  respondieron: { es: (n) => `${n} ${n === 1 ? 'respondió' : 'respondieron'}`, en: (n) => `${n} answered` },
  cerradas: { es: 'respuestas cerradas', en: 'answers closed' },
  anterior: { es: '← Anterior', en: '← Previous' },
  siguiente: { es: 'Siguiente →', en: 'Next →' },
  terminar: { es: 'Terminar', en: 'Finish' },
  cerrarRespuestas: { es: 'Cerrar respuestas', en: 'Close answers' },
  reabrirRespuestas: { es: 'Reabrir respuestas', en: 'Reopen answers' },
  reabrir: { es: 'Reabrir', en: 'Reopen' },
  ocultarResultados: { es: 'Ocultar resultados', en: 'Hide results' },
  mostrarResultados: { es: 'Mostrar resultados', en: 'Show results' },
  moderar: { es: 'Moderar', en: 'Moderate' },
  cerrar: { es: 'Cerrar', en: 'Close' },
  avisoModerarPc: {
    es: 'Si este PC está en el proyector, el curso ve esta lista. Para moderar en privado, usa «Celular» arriba.',
    en: 'If this computer is on the projector, the class sees this list. To moderate privately, use “Phone” above.',
  },
  celular: { es: 'Celular', en: 'Phone' },
  controlaCelular: { es: 'Controla desde tu celular', en: 'Control from your phone' },
  controlaCelularAyuda: { es: 'Ahí moderas en privado, con los nombres, y pasas las actividades.', en: 'There you moderate privately, with names, and move through the activities.' },
  qrCelular: { es: 'Código QR para moderar desde el celular', en: 'QR code to moderate from your phone' },
  avisoQrCelular: { es: 'Este código es solo para ti: quien lo escanee puede moderar. Ciérralo apenas lo uses.', en: 'This code is only for you: anyone who scans it can moderate. Close it as soon as you use it.' },
  listo: { es: 'Listo', en: 'Done' },

  // Resultados
  vacioNube: { es: 'Las palabras van a aparecer aquí.', en: 'Words will appear here.' },
  vacioAbiertas: { es: 'Las respuestas que apruebes van a aparecer aquí.', en: 'The answers you approve will appear here.' },
  sinRespuestas: { es: 'Todavía no hay respuestas.', en: 'No answers yet.' },

  // Moderación
  sinPalabras: { es: 'Todavía no llegan palabras.', en: 'No words yet.' },
  filtro: { es: 'filtro', en: 'filter' },
  mostrar: { es: 'Mostrar', en: 'Show' },
  ocultar: { es: 'Ocultar', en: 'Hide' },
  porRevisar: { es: 'Por revisar', en: 'To review' },
  sinPendientes: { es: 'No hay respuestas pendientes.', en: 'No pending answers.' },
  enPantalla: { es: 'En pantalla', en: 'On screen' },
  descartadas: { es: 'Descartadas', en: 'Discarded' },
  descartar: { es: 'Descartar', en: 'Discard' },
  aprobar: { es: 'Aprobar', en: 'Approve' },
  sinModeracion: { es: 'Esta actividad no necesita moderación: no hay texto libre.', en: 'This activity needs no moderation: there is no free text.' },

  // Celular del docente
  docente: { es: 'Docente', en: 'Teacher' },
  salaNoExiste: { es: 'Esta sala ya no existe.', en: 'This room no longer exists.' },
  enlaceNoSirve: { es: 'Este enlace no sirve para moderar. Escanea de nuevo el código del botón «Celular» en el proyector.', en: 'This link can’t be used to moderate. Scan the code from the “Phone” button on the projector again.' },
  preparandoElige: { es: 'Preparando. Elige con qué actividad empezar:', en: 'Getting ready. Choose the activity to start with:' },
  sinActividades: { es: 'Todavía no hay actividades. Agrégalas en el proyector.', en: 'No activities yet. Add them on the projector.' },
  sinPregunta: { es: 'Sin pregunta', en: 'No question' },
  asiSeVe: { es: 'Así se ve en la pantalla', en: 'What the screen shows' },

  // Estudiante
  tuNombre: { es: 'Tu nombre o apodo', en: 'Your name or nickname' },
  noHaySala: { es: 'No hay ninguna sala con ese PIN. Revísalo.', en: 'There is no room with that PIN. Check it.' },
  nombreNoAparece: { es: 'Tu nombre no aparece en la pantalla del curso. Solo lo ve tu profe.', en: 'Your name is not shown on the class screen. Only your teacher sees it.' },
  profeCerro: { es: 'Tu profe cerró la sala.', en: 'Your teacher closed the room.' },
  estasDentro: { es: '¡Estás dentro!', en: 'You’re in!' },
  miraPantalla: { es: 'Mira la pantalla: la actividad empieza pronto.', en: 'Look at the screen: the activity starts soon.' },
  respuestasCerradas: { es: 'Las respuestas están cerradas.', en: 'Answers are closed.' },
  listoGrande: { es: '¡Listo!', en: 'Done!' },
  seEnvio: { es: 'Tu respuesta se envió.', en: 'Your answer was sent.' },
  tuRespuesta: { es: 'Tu respuesta', en: 'Your answer' },
  enPantallaSinNombre: { es: 'Tu profe la puso en la pantalla, sin tu nombre.', en: 'Your teacher put it on the screen, without your name.' },
  profeRevisa: { es: 'Tu profe la revisa antes de mostrarla.', en: 'Your teacher reviews it before showing it.' },
  cambiarRespuesta: { es: 'Cambiar mi respuesta', en: 'Change my answer' },
  hastaPalabras: { es: (n) => `Hasta ${n} palabras.`, en: (n) => `Up to ${n} words.` },
  palabraN: { es: (n) => `Palabra ${n}`, en: (n) => `Word ${n}` },
  enviar: { es: 'Enviar', en: 'Send' },
  escribeRespuesta: { es: 'Escribe tu respuesta', en: 'Type your answer' },

  // Cuenta y materiales
  iniciarSesion: { es: 'Iniciar sesión con Google', en: 'Sign in with Google' },
  salir: { es: 'Salir', en: 'Sign out' },
  errPopupBloqueado: { es: 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio.', en: 'The browser blocked the Google window. Allow pop-ups for this site.' },
  errSinGoogle: { es: 'Falta activar el inicio de sesión con Google en la consola de Firebase.', en: 'Google sign-in is not enabled in the Firebase console.' },
  errDominio: { es: 'Falta autorizar este dominio en la consola de Firebase (Authentication → Settings).', en: 'This domain is not authorized in the Firebase console (Authentication → Settings).' },
  errSesion: { es: (m) => `No se pudo iniciar sesión: ${m}`, en: (m) => `Could not sign in: ${m}` },
  materialesAyuda: {
    es: 'Prepara tus actividades con calma y cárgalas en clase con un clic. Se guardan en tu cuenta, no en este computador.',
    en: 'Prepare your activities calmly and load them in class with one click. They are saved to your account, not to this computer.',
  },
  materialesSinSesion: { es: 'Inicia sesión con Google para guardar tus actividades.', en: 'Sign in with Google to save your activities.' },
  materialesLocal: { es: 'En modo local no hay cuentas: tus materiales quedan solo en este navegador.', en: 'Local mode has no accounts: your materials stay in this browser only.' },
  nuevoMaterial: { es: '+ Nuevo material', en: '+ New material' },
  sinMateriales: { es: 'Todavía no tienes materiales guardados.', en: 'You have no saved materials yet.' },
  nombreMaterial: { es: 'Nombre del material', en: 'Material name' },
  nombreMaterialEj: { es: 'Ej.: Célula · inicio de unidad', en: 'E.g.: Unit 3 · warm-up' },
  sinNombre: { es: 'Sin nombre', en: 'Untitled' },
  nActividades: { es: (n) => `${n} ${n === 1 ? 'actividad' : 'actividades'}`, en: (n) => `${n} ${n === 1 ? 'activity' : 'activities'}` },
  editar: { es: 'Editar', en: 'Edit' },
  borrar: { es: 'Borrar', en: 'Delete' },
  confirmarBorrar: { es: (n) => `¿Borrar «${n}»? No se puede deshacer.`, en: (n) => `Delete “${n}”? This can’t be undone.` },
  volver: { es: '← Mis materiales', en: '← My materials' },
  guardadoAuto: { es: 'Los cambios se guardan solos.', en: 'Changes are saved automatically.' },
  guardando: { es: 'Guardando…', en: 'Saving…' },
  guardado: { es: 'Guardado', en: 'Saved' },
  cargarMaterial: { es: 'Cargar de mis materiales', en: 'Load from my materials' },
  cargar: { es: 'Cargar', en: 'Load' },
  confirmarReemplazar: { es: '¿Reemplazar las actividades de la sala por este material?', en: 'Replace the room’s activities with this material?' },
  guardarEnMateriales: { es: 'Guardar en mis materiales', en: 'Save to my materials' },
  guardarCambios: { es: (n) => `Guardar cambios en «${n}»`, en: (n) => `Save changes to “${n}”` },
  guardarComoNuevo: { es: 'Guardar como nuevo', en: 'Save as new' },
  nombreParaGuardar: { es: '¿Con qué nombre lo guardo?', en: 'What name should I save it under?' },
  guardadoEn: { es: (n) => `Guardado en «${n}».`, en: (n) => `Saved to “${n}”.` },
  abrirSalaCon: { es: 'Abrir una sala', en: 'Open a room' },
}

const IdiomaCtx = createContext('es')
export const ProveedorIdioma = IdiomaCtx.Provider

/** El idioma del navegador, para antes de entrar a una sala. */
export const idiomaDelNavegador = () =>
  (typeof navigator !== 'undefined' && /^en\b/i.test(navigator.language || '') ? 'en' : 'es')

export const valido = (l) => (IDIOMAS.includes(l) ? l : 'es')

/** t('conectados', 3) → «3 conectados». Una clave que no existe se ve tal cual,
    para que se note en pantalla y no pase en silencio. */
export const traducir = (idioma, clave, ...args) => {
  const v = TEXTOS[clave]?.[valido(idioma)]
  if (v === undefined) return clave
  return typeof v === 'function' ? v(...args) : v
}

export function useT() {
  const idioma = useContext(IdiomaCtx)
  const t = (clave, ...args) => traducir(idioma, clave, ...args)
  t.idioma = idioma
  return t
}

/* El selector ES | EN. */
export function SelectorIdioma({ idioma, onCambiar, className = '' }) {
  return (
    <div role="group" aria-label="Idioma · Language" className={`inline-flex rounded-lg border border-slate-300 bg-white p-0.5 ${className}`}>
      {IDIOMAS.map(l => (
        <button key={l} onClick={() => onCambiar(l)} aria-pressed={idioma === l}
          className={`px-2.5 py-1 rounded-md text-sm font-bold uppercase ${idioma === l ? 'bg-teal-700 text-white' : 'text-slate-600'}`}>
          {l}
        </button>
      ))}
    </div>
  )
}
