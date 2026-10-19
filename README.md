# Aula abierta

Sitio publicado: https://profesorgerman.github.io/aula-abierta/

Práctica de Matemáticas Académica nocturna con 35 preguntas A/B/C de la prueba 2023-N01. Incluye páginas originales, reanudación local, calificación y descarga CSV con nombre y sección. El correo es opcional. No hay límite de tiempo.

Incluye páginas originales, selección de respuestas, progreso local, reanudación, calificación, revisión y descarga CSV. La clave fue resuelta para esta práctica y no es una clave oficial del MEP. Conviene revisión docente antes de usarla para evaluación.

El servicio para guardar intentos en una hoja privada y consultar los PDF públicos de Drive está preparado en `backend/Code.gs`. Falta autorizarlo e implementarlo en Google Apps Script y colocar su URL en `config.js`; véase `backend/README.md`. Mientras no esté activo, el sitio informa que el envío al docente no está disponible. No contiene datos de estudiantes en GitHub.

La revisión muestra la respuesta esperada; todavía no contiene procedimientos explicados. La clave es pública por ser práctica libre. Los nuevos PDF requieren revisar su clave antes de incorporarlos como prueba interactiva. El catálogo no cambia permisos de Drive ni expone PDF privados.

Fuente: https://drive.google.com/file/d/1vmwWhJF9ccsXXi3qyxMtiw1nQfzvduOZ/view

Verificación: `node --test tests/backend.test.cjs` comprueba calificación, validación, reintentos sin duplicados y exclusión de archivos privados. La verificación real del envío queda pendiente de la autorización de Google.
