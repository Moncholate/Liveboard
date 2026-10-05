/* Configuración web del proyecto Firebase "bundle-docente". No es secreta:
   Firebase la diseña para ir en el navegador; lo que protege los datos son las
   reglas (database.rules.json).

   Si vale null, Liveboard corre en MODO LOCAL: pizarra compartida solo entre
   pestañas de este mismo navegador. Sirve para probar sin internet. */
export const firebaseConfig = {
  apiKey: 'AIzaSyCI8-oEUV-ELUpnTgjyWD1WTaXLzUw9xY4',
  authDomain: 'bundle-docente.firebaseapp.com',
  databaseURL: 'https://bundle-docente-default-rtdb.firebaseio.com',
  projectId: 'bundle-docente',
  storageBucket: 'bundle-docente.firebasestorage.app',
  messagingSenderId: '895492385118',
  appId: '1:895492385118:web:9b692c376842723d4dc7cf',
}
