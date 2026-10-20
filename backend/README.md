# Servicio activo y prototipo anterior

El servicio activo está autorizado y su URL está en `config.js`. Se verificó una entrega y su reenvío el 19 de octubre de 2026: una sola fila, 35 aciertos de 35 y nota 100. El registro técnico se retiró después.

## Contrato observado

Se envía un formulario POST con el campo `payload`, cuyo valor es JSON:

- `attempt`: UUID estable para todo el intento y sus reenvíos.
- `exam`: `matematicas-2023-n01`.
- `id`: cédula introducida por el estudiante.
- `name`, `surname`: nombre y apellidos.
- `answers`: 35 valores A/B/C o null.

La respuesta es una página HTML de comprobante. El sitio no debe considerar recibido un intento simplemente porque abrió esa página. El estudiante comprueba «Entrega guardada». El registro privado utiliza la pestaña `Resultados` y los encabezados Intento, Fecha de entrega, Prueba, Cédula, Nombre, Apellidos, Aciertos, Total preguntas, Nota sobre 100, Sin responder, Respuestas, Versión de clave y Huella de entrega.

## Importante para mantenimiento

`Code.gs` se conserva como PROTOTIPO HISTÓRICO. Su JSON, identificador de prueba y esquema de hoja difieren del servicio activo. Sus pruebas locales no validan el despliegue actual. No ejecutarlo para reinstalar o reemplazar el servicio actual.

La incorporación automática de PDF desde Drive no está conectada en esta versión. No se han cambiado permisos de archivos de Drive. No hay envío de correo automático.

Verificación de producción: https://github.com/profesorgerman/aula-abierta/actions/runs/39364546623
