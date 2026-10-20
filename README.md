# Aula abierta

Sitio: https://profesorgerman.github.io/aula-abierta/

Práctica de Matemáticas Académica nocturna 2023-N01: 35 preguntas A/B/C, páginas originales, progreso durante la sesión, calificación, revisión y CSV. Sin límite de tiempo.

## Entrega al docente

El servicio está configurado en `config.js`. El estudiante completa cédula, nombre y apellidos y acepta el envío. Al finalizar, «Enviar al docente» abre una pestaña con el comprobante. Solo «Entrega guardada» confirma la recepción. Sección y correo son opcionales y solo se incluyen en la descarga local; no se envían al servidor.

El administrador abre el registro privado desde el enlace «Administrador». Los resultados no se publican en GitHub. El servicio calcula la nota y evita duplicar reenvíos del mismo intento.

Verificación real del 19 de octubre de 2026: un intento técnico con 35 respuestas correctas produjo nota 100; dos envíos produjeron una sola fila. Se retiró la fila técnica y se conservaron encabezados y formato. Evidencia: https://github.com/profesorgerman/aula-abierta/actions/runs/39364546623

## Materiales y límites de esta versión

Hay una prueba incorporada. La incorporación automática de nuevos PDF desde Drive todavía no está implementada en el servicio activo. Cada nueva prueba requiere revisar sus páginas y clave antes de publicarla. La revisión actual muestra las respuestas esperadas, sin procedimientos explicados.

La clave es pública y no es oficial del MEP; este sitio es una práctica libre, no una evaluación confidencial. No envía correos automáticos.

## Mantenimiento

- `enhancements.js`: identidad, consentimiento, envío mediante formulario y descarga CSV.
- `backend/Code.gs`: prototipo anterior, NO es el código del despliegue activo. No reemplazar el servicio publicado con ese archivo.
- `backend/README.md`: contrato observado del servicio activo.
- `tests/frontend.test.cjs`: validación del flujo actual de envío.
- `.github/workflows/verificar-servicio.yml`: comprobación manual con datos ficticios. Crea una fila técnica que debe retirarse tras verificarla.

Fuente: https://drive.google.com/file/d/1vmwWhJF9ccsXXi3qyxMtiw1nQfzvduOZ/view
