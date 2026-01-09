# AI Travel Agent - Guía de Uso

## ¿Qué es el AI Travel Agent?

El AI Travel Agent es tu asistente conversacional para gestionar tu itinerario de viaje. En lugar de editar manualmente actividades en el canvas, puedes pedirle al AI que lo haga por ti usando lenguaje natural.

**Ubicación**: Botón flotante en la esquina inferior derecha de la pantalla del trip.

---

## ¿Qué puede hacer?

El AI Travel Agent puede ayudarte con:

### 1. Agregar Actividades
- Agregar nuevas actividades a días específicos
- Sugerir horarios apropiados basándose en el itinerario actual
- Completar detalles de ubicación y tipo de actividad

**Ejemplos:**
```
"Agrega un restaurante para la cena del día 2"
"Quiero visitar un museo el día 3 por la mañana"
"Agrega tiempo libre en la tarde del día 1"
```

### 2. Mover Actividades
- Cambiar actividades de un día a otro
- Cambiar el horario de una actividad en el mismo día
- Reorganizar el orden de las actividades

**Ejemplos:**
```
"Mueve la visita al museo al día 3"
"Cambia el almuerzo al día 2 a las 2pm"
"Pon el desayuno al inicio del día"
```

### 3. Eliminar Actividades
- Remover actividades específicas
- Limpiar bloques de tiempo
- El AI pedirá confirmación para acciones importantes

**Ejemplos:**
```
"Elimina la actividad de la tarde del día 2"
"Quita el museo del itinerario"
"Borra el restaurante del día 1"
```

### 4. Obtener Información
- Ver detalles de un día específico
- Revisar el itinerario actual
- Preguntar sobre horarios y disponibilidad

**Ejemplos:**
```
"¿Qué tengo planeado para el día 2?"
"¿A qué hora termino las actividades del día 1?"
"¿Tengo tiempo libre el día 3?"
```

---

## Comandos Comunes

| Categoría | Ejemplo de Comando |
|-----------|-------------------|
| **Agregar** | "Agrega [actividad] al día [número]" |
| **Agregar con horario** | "Agrega [actividad] al día [número] a las [hora]" |
| **Mover** | "Mueve [actividad] al día [número]" |
| **Eliminar** | "Elimina [actividad] del día [número]" |
| **Consultar** | "¿Qué tengo planeado para el día [número]?" |
| **Buscar** | "Sugiere [tipo de actividad] para el día [número]" |

---

## Tips para Mejores Resultados

### ✅ Sé específico
**Bien**: "Agrega un restaurante italiano para la cena del día 2 a las 7pm"
**Mal**: "Pon algo para comer"

### ✅ Usa números de día
**Bien**: "Mueve el museo al día 3"
**Mal**: "Mueve el museo al miércoles" (el AI no conoce fechas exactas)

### ✅ Menciona la actividad claramente
**Bien**: "Elimina la visita al museo del día 2"
**Mal**: "Quita eso del día 2"

### ✅ Una acción a la vez
**Bien**: "Agrega un restaurante al día 2" → "Mueve el museo al día 3"
**Mal**: "Agrega un restaurante al día 2 y mueve el museo al día 3 y elimina el parque"

---

## Limitaciones Actuales

El AI Travel Agent **NO puede** hacer lo siguiente (aún):

❌ **Reservar vuelos o hoteles** - Solo puede gestionar actividades del itinerario
❌ **Buscar precios** - No tiene acceso a información de precios en tiempo real
❌ **Hacer reservaciones** - No puede reservar restaurantes, tours, etc.
❌ **Crear días nuevos** - Solo trabaja con los días ya existentes en tu plan
❌ **Modificar fechas del viaje** - Las fechas de inicio/fin son fijas
❌ **Cambiar destino u origen** - Solo gestiona actividades, no detalles del trip
❌ **Búsquedas complejas** - Búsquedas de lugares están limitadas por ahora

---

## Confirmaciones y Seguridad

### El AI pedirá confirmación cuando:

- Vas a eliminar múltiples actividades
- Vas a eliminar toda una categoría de actividades
- La acción podría tener consecuencias significativas

**Ejemplo de flujo con confirmación:**

```
Usuario: "Elimina todas las actividades del día 2"

AI: "Estás a punto de eliminar 5 actividades del día 2:
     - Desayuno en Café Central (8:00am)
     - Museo Nacional (10:00am)
     - Almuerzo en Bistro Local (1:00pm)
     - Parque de la Ciudad (3:00pm)
     - Cena en Restaurante Gourmet (7:00pm)

     ¿Estás seguro de que deseas continuar?"

Usuario: "Sí, elimina todo"

AI: "Hecho. He eliminado las 5 actividades del día 2."
```

---

## Solución de Problemas

### "El AI no entendió mi mensaje"
- Reformula usando palabras más simples
- Divide en comandos más pequeños
- Usa los ejemplos de arriba como guía

### "El AI ejecutó algo que no pedí"
- Edita manualmente el canvas para revertir
- Sé más específico en tu próximo mensaje
- Usa confirmaciones cuando elimines cosas

### "El AI dice que no puede hacer algo"
- Verifica si está en la lista de limitaciones
- Intenta reformular tu petición
- Considera hacerlo manualmente en el canvas

### "El chat no responde / se queda cargando"
- Verifica tu conexión a internet
- Recarga la página
- Si persiste, reporta el error

---

## Rate Limiting

Para controlar costos y asegurar calidad de servicio:

- **Límite**: 5 mensajes por minuto
- **Reset**: Cada minuto
- **Mensaje de error**: "Has excedido el límite de mensajes. Por favor espera un momento."

---

## Privacidad y Datos

### ¿Qué datos ve el AI?

El AI tiene acceso a:
- ✅ Tu itinerario actual (días, actividades, horarios)
- ✅ Información básica del trip (destino, fechas, número de viajeros)
- ✅ Historial de la conversación actual (últimos 20 mensajes)

El AI **NO** tiene acceso a:
- ❌ Información personal más allá del trip actual
- ❌ Otros trips tuyos
- ❌ Conversaciones de otros usuarios

### ¿Se guardan mis conversaciones?

Sí, las conversaciones se guardan en tu cuenta para que puedas:
- Revisar historial de cambios
- Continuar conversaciones previas
- Mantener contexto entre sesiones

Puedes eliminar conversaciones en cualquier momento (feature en desarrollo).

---

## Mejores Prácticas

### 1. Empieza simple
Primero familiarízate con comandos básicos antes de intentar acciones complejas.

### 2. Verifica los cambios
Después de cada acción del AI, revisa el canvas para confirmar que se ejecutó correctamente.

### 3. Usa el AI para tareas repetitivas
El AI es excelente para agregar múltiples actividades similares o reorganizar días completos.

### 4. Combina con edición manual
No tienes que usar solo el AI o solo el canvas. Usa lo que sea más eficiente para cada tarea.

### 5. Proporciona contexto
Si tienes preferencias específicas, menciónalo: "Agrega un restaurante vegetariano para la cena del día 2"

---

## Feedback y Mejoras

El AI Travel Agent está en desarrollo activo. Si encuentras bugs, tienes sugerencias, o quieres nuevas features:

- Reporta problemas en el chat de soporte
- Usa el botón de feedback en la app
- Envía sugerencias a [email de soporte]

---

## Próximas Features

Estamos trabajando en:

- 🔜 **Búsqueda de lugares** - Integración con Google Places para sugerencias
- 🔜 **Multi-día operations** - Agregar/modificar múltiples días a la vez
- 🔜 **Undo/Redo** - Deshacer cambios del AI fácilmente
- 🔜 **Sugerencias proactivas** - El AI detecta problemas y ofrece soluciones
- 🔜 **Voice input** - Envía mensajes de voz
- 🔜 **Export conversation** - Descarga conversaciones como PDF

---

## FAQs

**P: ¿El AI puede hacer errores?**
R: Sí, aunque raro, el AI puede malinterpretar instrucciones. Siempre verifica los cambios en el canvas.

**P: ¿Cuánto cuesta usar el AI?**
R: Incluido en tu plan actual. El rate limiting existe para controlar costos de infraestructura.

**P: ¿Puedo usar el AI en mobile?**
R: Sí, el chat está optimizado para mobile y funciona igual que en desktop.

**P: ¿El AI aprende de mis preferencias?**
R: Actualmente no, pero recordará el contexto de la conversación actual.

**P: ¿Qué pasa si cierro el chat mientras está respondiendo?**
R: El mensaje se cancelará y deberás enviarlo de nuevo.

**P: ¿Puedo tener múltiples conversaciones?**
R: Sí, cada trip puede tener múltiples conversaciones. Cambiar entre ellas vendrá pronto.

---

## Glosario

| Término | Definición |
|---------|------------|
| **Tool** | Acción específica que el AI puede ejecutar (agregar, mover, eliminar, etc.) |
| **Streaming** | Respuesta del AI que aparece palabra por palabra en tiempo real |
| **Confirmación** | Pregunta del AI antes de ejecutar acciones destructivas |
| **Context** | Información que el AI conoce sobre tu trip e historial de conversación |
| **Rate limiting** | Límite de mensajes por minuto para controlar uso |

---

**Última actualización**: Enero 2026
**Versión**: 1.0 (MVP)
