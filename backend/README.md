# Activación de Google Apps Script

Proyecto preparado: https://script.google.com/home/projects/1eghSZNvilWaOenfOC8l2zOCymMe8fll4x8mQFa4pqV2BwFmwDzk6OaiI/edit

1. El propietario ejecuta `configurar` y autoriza los permisos de Google. Crea una hoja privada **Aula abierta - Resultados**, guarda su ID en propiedades y comprueba la carpeta de materiales.
2. Implementar como **Aplicación web**, ejecutar como propietario y permitir acceso a **Cualquier persona**. El servicio solo acepta intentos, calcula su resultado y entrega el catálogo de PDF públicos; nunca entrega la hoja ni los resultados de otros estudiantes.
3. Copiar la URL `/exec` a `serviceUrl` en `config.js`.
4. Verificar desde el sitio un intento de prueba: confirmación, fila en la hoja privada y reintento sin duplicados.

La lista se consulta al abrir el sitio. Solo incluye PDF de la carpeta configurada con acceso «Cualquier persona» o «Cualquier persona con el enlace». No modifica permisos. Agregar un PDF al catálogo no lo convierte automáticamente en prueba: hay que revisar preguntas, páginas y clave.

No envía correos ni autentica estudiantes. Es práctica libre, no un examen confidencial. Límite global: 1000 envíos nuevos diarios. Incluye validación de datos, protección contra fórmulas, bloqueo de concurrencia y reintentos sin duplicados.

Estado: código preparado; falta autorización del propietario, implementación y verificación real de Sheets y catálogo. No se han creado registros de estudiantes.
