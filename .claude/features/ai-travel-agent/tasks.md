# Plan de Tareas: AI Travel Agent

## Resumen

- **Total de tareas**: 23
- **Estimacion total**: 26.5-38.5 horas (1-1.5 semanas de trabajo dedicado)
- **Milestones**: 6

---

## Milestone 1: Database Foundation (1.5-2.5h)

### Tarea 1.1: Crear migracion de Supabase para tablas de conversaciones
- **Tamano**: S
- **Dependencias**: ninguna
- **Archivos**:
  - Crear: `supabase/migrations/YYYYMMDDHHMMSS_create_agent_conversations.sql`
- **Descripcion**:
  Crear migracion SQL con las tablas `agent_conversations` y `agent_messages` segun la spec. Incluir indices para performance.
- **Criterio de aceptacion**:
  - [ ] Tabla `agent_conversations` creada con campos: id, trip_id, user_id, title, created_at, updated_at
  - [ ] Tabla `agent_messages` creada con campos: id, conversation_id, role, content, tool_calls, created_at
  - [ ] Foreign keys configurados correctamente (ON DELETE CASCADE)
  - [ ] Indices creados para trip_id, user_id, conversation_id
  - [ ] Migracion ejecutada exitosamente en local

---

### Tarea 1.2: Generar types de database y crear interfaces del feature
- **Tamano**: S
- **Dependencias**: Tarea 1.1
- **Archivos**:
  - Crear: `src/types/ai-agent.ts`
  - Modificar: `src/types/database.ts` (auto-generado)
- **Descripcion**:
  Ejecutar `npm run generate-types` para actualizar database.ts. Crear archivo de interfaces especificas para el AI Travel Agent.
- **Criterio de aceptacion**:
  - [ ] `database.ts` contiene types para agent_conversations y agent_messages
  - [ ] `ai-agent.ts` contiene interfaces: Conversation, Message, ToolCall, ChatStreamEvent, TravelAgentTool
  - [ ] Todos los types exportados correctamente

---

## Milestone 2: AI Backend Foundation (4-6h)

### Tarea 2.1: Implementar modulo de prompts del Travel Agent
- **Tamano**: M
- **Dependencias**: Tarea 1.2
- **Archivos**:
  - Crear: `src/lib/ai/travel-agent-prompts.ts`
- **Descripcion**:
  Implementar funciones para construir el system prompt del Travel Agent y formatear mensajes de conversacion. El prompt debe definir personalidad, capacidades, limitaciones y reglas del agente.
- **Criterio de aceptacion**:
  - [ ] Funcion `buildTravelAgentSystemPrompt(trip: TripContext)` implementada
  - [ ] Funcion `buildConversationMessages(history, newMessage)` implementada
  - [ ] System prompt incluye: rol, capacidades, limitaciones, formato de respuesta
  - [ ] Prompt incluye contexto del trip (destino, fechas, dias, etc.)
  - [ ] Unit tests para ambas funciones

---

### Tarea 2.2: Definir schemas de tools del Travel Agent
- **Tamano**: M
- **Dependencias**: Tarea 1.2
- **Archivos**:
  - Crear: `src/lib/ai/travel-agent-tools.ts` (solo definiciones)
- **Descripcion**:
  Crear constante `TRAVEL_AGENT_TOOLS` con los schemas JSON de cada tool para Anthropic API: add_activity_to_day, move_activity, remove_activity, get_day_details, search_places, ask_for_clarification.
- **Criterio de aceptacion**:
  - [ ] 6 tools definidos con name, description, input_schema
  - [ ] Schemas JSON validos segun formato Anthropic
  - [ ] Todos los campos required marcados correctamente
  - [ ] Descripciones claras para el AI

---

### Tarea 2.3: Crear API route basico de chat (sin streaming)
- **Tamano**: L
- **Dependencias**: Tarea 2.1, Tarea 2.2
- **Archivos**:
  - Crear: `src/app/api/ai/travel-agent/chat/route.ts`
- **Descripcion**:
  Implementar endpoint POST que recibe mensaje, carga contexto del trip, invoca Anthropic Messages API con tools, y retorna respuesta. Sin streaming inicialmente - respuesta JSON simple.
- **Criterio de aceptacion**:
  - [ ] Endpoint POST /api/ai/travel-agent/chat funcional
  - [ ] Valida tripId, mensaje no vacio
  - [ ] Carga plan actual del trip desde Supabase
  - [ ] Invoca Anthropic Messages API con system prompt y tools
  - [ ] Retorna respuesta del AI (aunque no ejecute tools aun)
  - [ ] Manejo basico de errores (API down, trip no existe)

---

### Tarea 2.4: Testear API basico con curl/Postman
- **Tamano**: S
- **Dependencias**: Tarea 2.3
- **Archivos**:
  - Crear: `docs/features/ai-travel-agent-api-test.md` (opcional, notas de testing)
- **Descripcion**:
  Testear manualmente el endpoint con diferentes tipos de mensajes para validar que el AI responde correctamente.
- **Criterio de aceptacion**:
  - [ ] API responde a mensaje simple ("Hola")
  - [ ] API responde a pregunta sobre el viaje
  - [ ] API sugiere usar tool cuando es apropiado (aunque no lo ejecute)
  - [ ] Errores retornan status codes correctos

---

## Milestone 3: Tool Execution (7-10h)

### Tarea 3.1: Implementar tool `add_activity_to_day`
- **Tamano**: L
- **Dependencias**: Tarea 2.3
- **Archivos**:
  - Modificar: `src/lib/ai/travel-agent-tools.ts`
- **Descripcion**:
  Implementar funcion de ejecucion para agregar una actividad a un dia especifico. Debe validar que el dia existe, crear la actividad con formato correcto, y actualizar el plan en Supabase.
- **Criterio de aceptacion**:
  - [ ] Funcion `executeAddActivity(input, context)` implementada
  - [ ] Valida que dayNumber existe en el plan
  - [ ] Crea actividad con formato correcto (time, activity, location, icon)
  - [ ] Actualiza plan en Supabase
  - [ ] Retorna confirmacion con detalles de lo agregado
  - [ ] Maneja error si dia no existe

---

### Tarea 3.2: Implementar tool `get_day_details`
- **Tamano**: M
- **Dependencias**: Tarea 2.3
- **Archivos**:
  - Modificar: `src/lib/ai/travel-agent-tools.ts`
- **Descripcion**:
  Implementar funcion read-only que retorna los detalles de un dia especifico del itinerario para que el AI tenga contexto.
- **Criterio de aceptacion**:
  - [ ] Funcion `executeGetDayDetails(input, context)` implementada
  - [ ] Retorna actividades del dia con horarios y ubicaciones
  - [ ] Retorna bloques libres identificados
  - [ ] Maneja error si dia no existe

---

### Tarea 3.3: Implementar tool `move_activity`
- **Tamano**: L
- **Dependencias**: Tarea 3.1
- **Archivos**:
  - Modificar: `src/lib/ai/travel-agent-tools.ts`
- **Descripcion**:
  Implementar funcion para mover una actividad existente a otro dia/horario. Debe encontrar la actividad, removerla del dia original, y agregarla al nuevo.
- **Criterio de aceptacion**:
  - [ ] Funcion `executeMoveActivity(input, context)` implementada
  - [ ] Encuentra actividad por nombre o indice
  - [ ] Remueve del dia original
  - [ ] Agrega al nuevo dia con nuevo horario
  - [ ] Actualiza plan en Supabase
  - [ ] Detecta y reporta conflictos de horario

---

### Tarea 3.4: Implementar tool `remove_activity` con confirmacion
- **Tamano**: M
- **Dependencias**: Tarea 3.1
- **Archivos**:
  - Modificar: `src/lib/ai/travel-agent-tools.ts`
- **Descripcion**:
  Implementar funcion para eliminar actividad. Debe requerir confirmacion explicita del usuario antes de ejecutar.
- **Criterio de aceptacion**:
  - [ ] Funcion `executeRemoveActivity(input, context)` implementada
  - [ ] Si requireConfirmation=true, retorna pregunta de confirmacion en vez de ejecutar
  - [ ] Si confirmado, elimina actividad del dia
  - [ ] Actualiza plan en Supabase
  - [ ] Retorna confirmacion de eliminacion

---

### Tarea 3.5: Integrar ejecucion de tools en API route
- **Tamano**: L
- **Dependencias**: Tarea 3.1, 3.2, 3.3, 3.4
- **Archivos**:
  - Modificar: `src/app/api/ai/travel-agent/chat/route.ts`
- **Descripcion**:
  Conectar el flujo de tool calling: cuando Anthropic API retorna tool_use, ejecutar la funcion correspondiente, pasar resultado de vuelta al AI, y obtener respuesta final.
- **Criterio de aceptacion**:
  - [ ] API detecta tool_use en respuesta de Anthropic
  - [ ] Ejecuta tool correspondiente con executeToolCall
  - [ ] Pasa tool_result de vuelta al AI
  - [ ] Continua loop hasta que AI retorna texto final
  - [ ] Respuesta incluye tanto acciones ejecutadas como mensaje final

---

### Tarea 3.6: Testing de integracion de tools
- **Tamano**: M
- **Dependencias**: Tarea 3.5
- **Archivos**: ninguno nuevo
- **Descripcion**:
  Testear flujos completos: agregar actividad via chat, mover actividad, eliminar con confirmacion. Verificar que el plan se actualiza correctamente en Supabase.
- **Criterio de aceptacion**:
  - [ ] "Agrega un restaurante para la cena del dia 2" funciona
  - [ ] "Mueve el museo al dia 3" funciona
  - [ ] "Elimina la actividad del dia 4" pide confirmacion
  - [ ] Plan en Supabase refleja cambios correctamente

---

## Milestone 4: Frontend Components (5-7h)

### Tarea 4.1: Crear componente ChatWidget
- **Tamano**: L
- **Dependencias**: Tarea 2.3
- **Archivos**:
  - Crear: `src/components/ai/ChatWidget.tsx`
  - Crear: `src/components/ai/TypingIndicator.tsx`
- **Descripcion**:
  Implementar widget flotante con boton que abre/cierra un Sheet (shadcn). Incluir area de mensajes, input de texto, y estado de loading.
- **Criterio de aceptacion**:
  - [ ] Boton flotante visible en esquina inferior derecha
  - [ ] Click abre Sheet con area de chat
  - [ ] Input de texto funcional
  - [ ] Estado de loading cuando envia mensaje
  - [ ] Scroll automatico a nuevo contenido
  - [ ] Responsive (funciona en mobile)

---

### Tarea 4.2: Crear componente ChatMessage
- **Tamano**: M
- **Dependencias**: Tarea 1.2
- **Archivos**:
  - Crear: `src/components/ai/ChatMessage.tsx`
- **Descripcion**:
  Componente para renderizar un mensaje individual. Diferencia visual entre usuario y asistente. Timestamps y avatares.
- **Criterio de aceptacion**:
  - [ ] Mensajes de usuario alineados a la derecha, fondo diferente
  - [ ] Mensajes de asistente alineados a la izquierda
  - [ ] Avatar diferenciado (usuario vs AI)
  - [ ] Timestamp visible
  - [ ] Soporte para contenido largo (word wrap)

---

### Tarea 4.3: Implementar hook useChatConversation
- **Tamano**: L
- **Dependencias**: Tarea 1.2, Tarea 2.3
- **Archivos**:
  - Crear: `src/hooks/useChatConversation.ts`
- **Descripcion**:
  Hook para gestionar estado de conversacion: cargar historial, enviar mensajes, actualizar lista. Sin streaming por ahora.
- **Criterio de aceptacion**:
  - [ ] Carga historial desde Supabase al montar
  - [ ] Funcion sendMessage envia a API y agrega respuesta
  - [ ] Estados: loading, error, messages, conversationId
  - [ ] Crea nueva conversacion si no existe
  - [ ] Persiste mensajes en Supabase

---

### Tarea 4.4: Integrar ChatWidget en canvas layout
- **Tamano**: S
- **Dependencias**: Tarea 4.1, 4.3
- **Archivos**:
  - Modificar: `src/app/trips/[id]/page.tsx`
- **Descripcion**:
  Importar y renderizar ChatWidget en la pagina del trip, pasando tripId como prop.
- **Criterio de aceptacion**:
  - [ ] ChatWidget visible en pagina /trips/[id]
  - [ ] Widget no afecta layout del canvas
  - [ ] tripId pasado correctamente al widget

---

### Tarea 4.5: Testing E2E basico del chat
- **Tamano**: M
- **Dependencias**: Tarea 4.4
- **Archivos**: ninguno nuevo (testing manual)
- **Descripcion**:
  Testear flujo completo: abrir chat, enviar mensaje, ver respuesta, ejecutar accion via chat, verificar que canvas se actualiza.
- **Criterio de aceptacion**:
  - [ ] Flujo completo funciona sin errores de consola
  - [ ] Acciones ejecutadas reflejan cambios en el canvas
  - [ ] Historial persiste al recargar pagina

---

## Milestone 5: Streaming & Polish (5-7h)

### Tarea 5.1: Implementar SSE streaming en API route
- **Tamano**: L
- **Dependencias**: Tarea 3.5
- **Archivos**:
  - Modificar: `src/app/api/ai/travel-agent/chat/route.ts`
- **Descripcion**:
  Cambiar API route para retornar Server-Sent Events stream. Enviar tokens a medida que llegan de Anthropic API.
- **Criterio de aceptacion**:
  - [ ] Response headers configurados para SSE
  - [ ] Stream envia eventos: text, tool_call, tool_result, done, error
  - [ ] Tokens de texto enviados incrementalmente
  - [ ] Stream cierra correctamente al terminar

---

### Tarea 5.2: Crear hook useChatStreaming
- **Tamano**: M
- **Dependencias**: Tarea 5.1
- **Archivos**:
  - Crear: `src/hooks/useChatStreaming.ts`
- **Descripcion**:
  Hook para procesar SSE streams del API. Parsear eventos y actualizar mensaje en tiempo real.
- **Criterio de aceptacion**:
  - [ ] Conecta a endpoint SSE
  - [ ] Parsea eventos correctamente
  - [ ] Actualiza mensaje mientras llega texto
  - [ ] Maneja eventos de error y done
  - [ ] Cleanup correcto al desmontar

---

### Tarea 5.3: Integrar streaming en ChatWidget
- **Tamano**: M
- **Dependencias**: Tarea 5.1, 5.2
- **Archivos**:
  - Modificar: `src/components/ai/ChatWidget.tsx`
  - Modificar: `src/hooks/useChatConversation.ts`
- **Descripcion**:
  Actualizar ChatWidget para usar streaming. Mostrar texto a medida que llega, indicador de "escribiendo...".
- **Criterio de aceptacion**:
  - [ ] Texto aparece token por token
  - [ ] Indicador de typing visible mientras streaming
  - [ ] Mensaje completo al terminar stream
  - [ ] Error handling si stream falla

---

### Tarea 5.4: Agregar markdown rendering en mensajes
- **Tamano**: M
- **Dependencias**: Tarea 4.2
- **Archivos**:
  - Modificar: `src/components/ai/ChatMessage.tsx`
- **Descripcion**:
  Usar react-markdown para renderizar contenido de mensajes del asistente con formato.
- **Criterio de aceptacion**:
  - [ ] Listas renderizadas correctamente
  - [ ] Bold/italic funcionan
  - [ ] Code blocks con syntax highlighting basico
  - [ ] Links clickeables

---

### Tarea 5.5: Implementar confirmaciones para acciones destructivas
- **Tamano**: M
- **Dependencias**: Tarea 3.4, 4.1
- **Archivos**:
  - Crear: `src/components/ai/ConfirmationDialog.tsx`
  - Modificar: `src/components/ai/ChatWidget.tsx`
- **Descripcion**:
  Cuando el AI pide confirmacion para eliminar, mostrar dialog inline en el chat con botones Confirmar/Cancelar.
- **Criterio de aceptacion**:
  - [ ] Dialog aparece cuando AI pide confirmacion
  - [ ] Boton Confirmar ejecuta accion
  - [ ] Boton Cancelar cancela y AI responde acordemente
  - [ ] Dialog deshabilitado despues de responder

---

### Tarea 5.6: Agregar rate limiting en API
- **Tamano**: S
- **Dependencias**: Tarea 5.1
- **Archivos**:
  - Modificar: `src/app/api/ai/travel-agent/chat/route.ts`
- **Descripcion**:
  Implementar rate limiting simple (5 mensajes/minuto por usuario) para controlar costos de API.
- **Criterio de aceptacion**:
  - [ ] Contador por userId en memoria
  - [ ] Retorna 429 si excede limite
  - [ ] Mensaje de error amigable al usuario
  - [ ] Reset cada minuto

---

## Milestone 6: Testing & Refinement (4-6h)

### Tarea 6.1: Testing de edge cases
- **Tamano**: L
- **Dependencias**: Tarea 5.3
- **Archivos**: ninguno nuevo
- **Descripcion**:
  Testear todos los edge cases documentados en spec.md: ambiguedad, conflictos, fuera de scope, errores de API, etc.
- **Criterio de aceptacion**:
  - [ ] "Elimina todo" pide confirmacion
  - [ ] "Agrega a dia 99" informa que no existe
  - [ ] "Reserva el hotel" responde que esta fuera de scope
  - [ ] Error de API muestra mensaje amigable
  - [ ] Mensaje largo funciona sin errores

---

### Tarea 6.2: Refinar prompts basado en comportamiento
- **Tamano**: M
- **Dependencias**: Tarea 6.1
- **Archivos**:
  - Modificar: `src/lib/ai/travel-agent-prompts.ts`
- **Descripcion**:
  Ajustar system prompt y tool descriptions basado en comportamiento observado durante testing.
- **Criterio de aceptacion**:
  - [ ] AI elige tool correcto >90% de las veces
  - [ ] Respuestas son concisas y utiles
  - [ ] Confirmaciones son claras
  - [ ] Tono es amigable pero profesional

---

### Tarea 6.3: Agregar loading states y animaciones
- **Tamano**: S
- **Dependencias**: Tarea 5.3
- **Archivos**:
  - Modificar: `src/components/ai/ChatWidget.tsx`
  - Modificar: `src/components/ai/TypingIndicator.tsx`
- **Descripcion**:
  Polish visual: skeleton loading, animacion de typing dots, transiciones suaves al abrir/cerrar chat.
- **Criterio de aceptacion**:
  - [ ] Indicador de typing animado (3 dots)
  - [ ] Transicion suave al abrir Sheet
  - [ ] Scroll smooth a nuevos mensajes

---

### Tarea 6.4: Crear endpoints de gestion de conversaciones
- **Tamano**: M
- **Dependencias**: Tarea 1.1
- **Archivos**:
  - Crear: `src/app/api/ai/travel-agent/conversations/[tripId]/route.ts`
  - Crear: `src/app/api/ai/travel-agent/conversations/[conversationId]/route.ts`
- **Descripcion**:
  Endpoints para listar conversaciones de un trip y eliminar una conversacion.
- **Criterio de aceptacion**:
  - [ ] GET /conversations/[tripId] retorna lista de conversaciones
  - [ ] DELETE /conversations/[conversationId] elimina conversacion y mensajes
  - [ ] Validacion de permisos (solo owner del trip)

---

### Tarea 6.5: Documentacion de uso
- **Tamano**: S
- **Dependencias**: Tarea 6.1
- **Archivos**:
  - Crear: `docs/features/ai-travel-agent-usage.md`
- **Descripcion**:
  Escribir documentacion para usuarios sobre como usar el AI Travel Agent: ejemplos de comandos, limitaciones, tips.
- **Criterio de aceptacion**:
  - [ ] Seccion de "Que puedes hacer"
  - [ ] Ejemplos de comandos comunes
  - [ ] Seccion de limitaciones
  - [ ] FAQs

---

## Orden de Ejecucion Sugerido

```
1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 2.4
                         ↓
              3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6
                                        ↓
              4.1 → 4.2 → 4.3 → 4.4 → 4.5
                                   ↓
              5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6
                                           ↓
              6.1 → 6.2 → 6.3 → 6.4 → 6.5
```

**Tareas paralelizables:**
- 2.1 y 2.2 pueden hacerse en paralelo
- 3.1, 3.2 pueden empezarse en paralelo
- 4.1 y 4.2 pueden empezarse en paralelo (una vez que 2.3 existe)

---

## Notas para el Implementer

1. **Supabase Queries**: SIEMPRE usar `.maybeSingle()` cuando verificas si un registro existe. Usar `.single()` solo cuando GARANTIZAS que existe exactamente 1 fila.

2. **Context del Plan**: Cargar el plan completo antes de ejecutar cualquier tool. El AI necesita saber el estado actual para tomar decisiones.

3. **Rate Limiting**: La implementacion en memoria es para MVP. En produccion con multiples instancias, necesitaras Redis o similar.

4. **Costos de Anthropic**: Cada mensaje cuesta tokens. Monitorea usando la tabla `ai_request_logs` existente.

5. **Mobile Testing**: El Sheet de shadcn puede comportarse diferente en mobile. Testear en dispositivos reales.

6. **Error Boundaries**: Envolver ChatWidget en error boundary para evitar que errores rompan toda la pagina.

7. **Orden de tools**: `get_day_details` es util para que el AI entienda el contexto antes de ejecutar cambios.

8. **Streaming**: El streaming de Anthropic puede enviar chunks muy pequenos. Considera debouncing para actualizar UI.

---

## Estimaciones por Milestone

| Milestone | Tareas | Estimacion |
|-----------|--------|------------|
| 1. Database Foundation | 2 | 1.5-2.5h |
| 2. AI Backend Foundation | 4 | 4-6h |
| 3. Tool Execution | 6 | 7-10h |
| 4. Frontend Components | 5 | 5-7h |
| 5. Streaming & Polish | 6 | 5-7h |
| 6. Testing & Refinement | 5 | 4-6h |
| **TOTAL** | **28** | **26.5-38.5h** |
