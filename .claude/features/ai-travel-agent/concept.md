# AI Travel Agent - Concept

## Estado: COMPLETADO

---

## Summary

AI Travel Agent conversacional que actua como orquestador de los 3 agentes existentes (Architect, Curator, Optimizer). Se presenta como un chat flotante tipo widget que permite al usuario interactuar en lenguaje natural para ejecutar cambios directamente en el itinerario.

---

## Problem

Actualmente el usuario debe navegar manualmente por el canvas y usar controles especificos para cada tipo de modificacion. No existe una forma unificada de expresar intenciones complejas en lenguaje natural que involucren multiples aspectos del viaje (estructura, actividades, logistica).

---

## Users

Usuarios de Travelr que estan planificando un viaje y prefieren interactuar conversacionalmente en lugar de usar la UI manual del canvas. Especialmente util para usuarios que quieren hacer cambios complejos o no saben exactamente donde encontrar una funcionalidad.

---

## Value Proposition

Permite al usuario expresar cualquier intencion de modificacion del viaje en lenguaje natural. El Travel Agent interpreta la peticion, delega al agente especializado correcto (Architect para estructura, Curator para sugerencias de lugares, Optimizer para logistica), y ejecuta los cambios directamente en el itinerario sin friccion.

---

## MVP Scope

1. **Widget de chat flotante** - Boton en esquina inferior derecha que abre overlay
2. **Input de texto** - Para mensajes del usuario
3. **Visualizacion de respuestas** - Formato rico con markdown y listas
4. **Ejecucion de acciones:**
   - Agregar actividad (ejecuta directo)
   - Mover actividad (ejecuta directo)
   - Eliminar actividad (requiere confirmacion)
5. **Orquestacion inteligente** - Analiza peticion y delega a Architect/Curator/Optimizer
6. **Feedback visual** - Confirmacion en chat + highlight en canvas
7. **Persistencia** - Historial de conversacion por trip en Supabase

---

## User Stories

| ID | Historia | Prioridad |
|----|----------|-----------|
| US1 | Como usuario, quiero abrir un chat flotante desde cualquier pantalla del canvas para hacer preguntas o peticiones sobre mi viaje. | MUST |
| US2 | Como usuario, quiero decir "Agregame un restaurante cerca del hotel para la cena del dia 2" y que el agente lo haga automaticamente. | MUST |
| US3 | Como usuario, quiero decir "Mueve la visita al museo al dia 3 por la manana" y que se reorganice el itinerario. | MUST |
| US4 | Como usuario, quiero decir "Elimina todas las actividades del dia 4" y que me pida confirmacion antes de ejecutar. | MUST |
| US5 | Como usuario, quiero ver el historial de mi conversacion cuando vuelvo a abrir el chat. | SHOULD |
| US6 | Como usuario, quiero recibir confirmacion visual tanto en el chat como en el canvas cuando se ejecuta un cambio. | SHOULD |

---

## Non-Functional Requirements

- El chat NO debe bloquear la interaccion con el canvas (overlay no modal)
- Respuestas del agente en menos de 5 segundos para peticiones simples
- El historial debe cargarse rapido al abrir el chat (paginacion si es necesario)
- El widget debe ser responsive y funcionar en movil

---

## Decisiones de Diseno

| Aspecto | Decision | Razon |
|---------|----------|-------|
| Capacidad de ejecucion | EJECUTA directamente | UX mas fluida, usuario quiere accion no sugerencias |
| Posicion UI | Chat flotante (widget) | No afecta layout del canvas, accesible siempre |
| Relacion con agentes | ORQUESTADOR | Aprovecha especializacion de agentes existentes |
| Persistencia | SI, en BD | Usuario espera ver historial al volver |
| Confirmacion | Solo para cambios destructivos | Balance entre velocidad y seguridad |
| Fuera de scope | Respuesta informativa | Honesto sobre limitaciones sin frustrar |

---

## Arquitectura Propuesta

```
Usuario escribe mensaje
        |
        v
+------------------+
| AI Travel Agent  |  <-- Orquestador principal
| (Conversacional) |
+------------------+
        |
        v
  Analiza intencion
        |
   +----+----+----+
   |    |    |    |
   v    v    v    v
+----+ +----+ +----+ +----+
|Arch| |Cur | |Opt | |Q&A |
|itct| |ator| |imzr| |Info|
+----+ +----+ +----+ +----+
   |    |    |    |
   +----+----+----+
        |
        v
  Ejecuta accion en canvas
  (via Zustand store)
        |
        v
  Respuesta al usuario
  + feedback visual
```

---

## Metrics

- % de usuarios que usan el chat vs UI manual
- Tasa de exito de acciones ejecutadas
- Tiempo promedio para completar modificaciones complejas

---

## Out of Scope (MVP)

- Reservas de vuelos/hoteles
- Pagos
- Compartir viaje
- Integraciones con servicios externos de booking
- Voz/audio input

---

## Risks

| Riesgo | Mitigacion |
|--------|------------|
| Ambiguedad en peticiones | Pedir clarificacion antes de ejecutar si hay duda |
| Conflictos de state | Bloquear edicion manual mientras agente ejecuta |
| Costos de API | Limitar longitud de contexto, cache de respuestas comunes |

---

## Next Steps

Proceder a **Spec Writer** para especificacion tecnica detallada.
