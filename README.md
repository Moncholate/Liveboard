# Liveboard

La pizarra en vivo para cualquier asignatura. El docente proyecta, los estudiantes responden desde el celular con un PIN y un apodo.

| Actividad | Qué se proyecta |
| --- | --- |
| Nube de palabras | Hasta 3 palabras por estudiante; las más repetidas, más grandes |
| Encuesta | De 2 a 4 alternativas (A–D), con barras y porcentajes |
| Escala 1–5 | El promedio y cuántos eligieron cada valor |
| Respuesta abierta | Solo las que el docente aprueba |

## Reglas

- **El proyector no muestra nombres.** Ni en la sala de espera (dice cuántos entraron) ni en los resultados.
- **Moderación:** las respuestas abiertas salen solo si el docente las aprueba. Las palabras con groserías entran ocultas a la nube; el docente puede restaurarlas u ocultar cualquier otra.
- **Moderar en privado:** el botón «Celular» del proyector muestra un QR para controlar la sala desde el teléfono del docente, donde sí se ve quién escribió qué.
- Sin cuentas de estudiantes: PIN y apodo. Al cerrar la sala se borra todo.

## Desarrollo

```
npm install
npm run dev      # http://localhost:5176
npm run check    # las pruebas (vitest)
npm run build
```

Sin configuración de Firebase (`src/net/firebase-config.js` en `null`) corre en **modo local**: la sala se comparte solo entre pestañas del mismo navegador. `?local` en la URL fuerza ese modo aunque haya Firebase.

Cada push a `main` corre las pruebas y publica en GitHub Pages.

## Firebase

Proyecto `bundle-docente`, Realtime Database. Las reglas están en `database.rules.json` y **no las publica el CI**: cuando cambian, se pegan a mano en la consola (Realtime Database → Reglas).

El motor en vivo (`src/net/`) es una copia del de Kachai: salas con PIN, presencia, reconexión y reloj del servidor. Si se corrige algo ahí, conviene llevarlo también a Kachai.
