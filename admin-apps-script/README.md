# Administrador de Aula Abierta (Apps Script)

Estado: código preparado; requiere instalación, autorización de Google y despliegue. No reemplaza automáticamente el servicio anterior ni controla aún las páginas publicadas.

## Instalación
1. Crear un proyecto NUEVO en Google Apps Script. No reemplazar el backend histórico.
2. Copiar `Code.gs` y crear el archivo HTML `Admin` con el contenido de `Admin.html`. Copiar el manifiesto `appsscript.json` habilitando su visualización en Configuración.
3. En Configuración → Propiedades de la secuencia de comandos, añadir `SPREADSHEET_ID` con el identificador de la hoja privada de resultados existente. No publicar la hoja ni sus datos.
4. Añadir `INITIAL_PASSWORD` con una clave única de al menos 14 caracteres, introducida por el propietario. No poner la clave en código, GitHub ni mensajes.
5. Ejecutar `instalar_` desde el editor y autorizar el acceso a Hojas de cálculo. Crea la configuración de las dos pruebas deshabilitadas; conserva la hoja Resultados. Convierte la clave a un verificador PBKDF2-HMAC-SHA256 (20.000 iteraciones) con pepper y elimina INITIAL_PASSWORD. Editores del proyecto son administradores de confianza.
6. Implementar → Nueva implementación → Aplicación web → Ejecutar como propietario. El acceso público solo es necesario para recibir entregas sin cuenta Google. Revisar y autorizar expresamente esta exposición. El panel exige clave y cada operación privada comprueba la sesión.
7. Abrir la URL /exec; ingresar clave; probar consulta y programación. La sesión expira como máximo en una hora y puede caducar antes por caché. Cinco fallos bloquean globalmente el ingreso durante 15 minutos; esta protección puede ser usada para causar bloqueo temporal. No es una solución de identidad empresarial.

## Integración pendiente con las pruebas publicadas
La habilitación controla SOLO las entregas que lleguen a este NUEVO despliegue. El servicio anterior y el HTML estático siguen funcionando hasta migrarlos.
- Conservar la URL anterior para reversión; actualizar config.js solo después de verificar este servicio.
- `GET /exec?action=status` devuelve únicamente estado público. No contiene estudiantes ni claves. Se puede consultar mediante fetch si Google permite CORS en el cliente; comprobar en el sitio publicado antes de activar el bloqueo visual. Si falla, mostrar fallo de conexión, no asumir apertura.
- Enviar por formulario POST (nueva ventana) un campo `payload` JSON con `attempt` UUID estable, `exam`, `id`, `name`, `surname`, `answers`. Cada respuesta A/B/C o null. Nunca enviar nota calculada por cliente.
- IDs: `matematicas-2023-n01` (35 respuestas) y `geometria-7` (24). Para Geometría añadir la entrega al docente y conectar nombre/sección; no reponer el antiguo enlace externo de entrega.
- El servidor verifica disponibilidad y fechas, recalcula nota, impide duplicados por intento y muestra recibo. Conservar el UUID hasta confirmar recibo. La sección no tiene columna propia en el esquema legado: planificar migración si se requiere filtro por sección.
- Las preguntas y respuestas de práctica están publicadas en GitHub. Deshabilitar recepción no retira las preguntas ni impide práctica local. Para restringir acceso completo, alojar el cuestionario en Apps Script y servirlo solo tras comprobar disponibilidad.
- Probar entrega abierta, rechazada estando cerrada, límites de programación, reenvío idéntico, cambio de respuestas con mismo UUID y lectura de resultados históricos antes de retirar el endpoint anterior.

## Resultados y estadísticas
Lee Resultados A:M sin modificar resultados históricos. Filtra por identificador exacto de prueba. Muestra entregas, promedio, mínimo, máximo, distribución de notas, búsqueda y CSV. Estadísticas por intento, no por estudiante único. No realiza decisiones de aprobación académica automáticas.

Para restablecer la clave, añadir INITIAL_PASSWORD y ejecutar instalar_ desde el editor. Invalida todas las sesiones; conserva disponibilidad existente. No hay recuperación pública de claves.

Las funciones privadas terminan en `_` y no son accesibles con google.script.run: https://developers.google.com/apps-script/guides/html/communication
