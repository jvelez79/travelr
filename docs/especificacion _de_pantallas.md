Tiene sentido que cueste visualizarlo solo en texto. Vamos a convertirlo en algo más concreto: una “historia” de pantalla por pantalla, como si fueras el usuario usando la app por primera vez.

## Pantalla 1: “Empecemos tu viaje”

Objetivo: datos mínimos, cero fricción.

Elementos:
- Campos simples:
  - Destino principal: “¿A dónde?” (input tipo buscador con sugerencias).
  - Fechas: selector de rango.
  - Quién viaja: chips rápidos (“Solo”, “Pareja”, “Familia”, “Amigos”).
- Un slider o 3 chips para estilo:
  - “Relax”
  - “Balanceado”
  - “Aventura”
- Botón grande: “Crear borrador de viaje”.

Interacción:
- El usuario mete solo eso y toca “Crear borrador”.
- La AI genera una **estructura básica**: “5 días en Roma”, por ejemplo, divididos en bloques (Día 1–5) con títulos tipo “Llegada y paseo ligero”, “Centro histórico”, etc., sin aún listar actividades específicas.
- Pantalla siguiente muestra ya un timeline con días vacíos pero “etiquetados”.

## Pantalla 2: Vista general del viaje (Timeline)

Objetivo: que el usuario vea que “ya tiene algo”.

Elementos:
- Timeline vertical u horizontal con cards por día:
  - Día 1: Llegada y primer paseo.
  - Día 2: Centro histórico.
  - Día 3: Barrios alternativos.
- En cada card:
  - Horas aún vacías (bloques tipo “Mañana”, “Tarde”, “Noche”).
  - Botón: “Ver sugerencias para este día”.
- Arriba: un pequeño banner tipo:
  - “Plan balanceado para pareja, 5 días en Roma. Puedes ajustar el estilo.”

Interacción:
- El usuario ve el overview y entiende: “ok, ya hay una estructura”.
- Puede:
  - Cambiar el estilo global (“Más relax / Más intenso”) con un toggle.
  - Entrar a un día concreto tocando “Ver sugerencias”.

## Pantalla 3: Sugerencias para un día

Objetivo: discovery rápido, sin abrumar.

Elementos para “Día 2 – Centro histórico”:
- Encabezado: “Ideas para tu mañana en el Centro histórico”.
- Sección “Actividades ancla (recomendadas)”:
  - 3 cards grandes (ej. Colosseum tour, Foro Romano, etc.).
- Sección “Otras ideas cercanas”:
  - 3–5 cards pequeñas (lugares secundarios, cafés, plazas).
- Filtros rápidos arriba:
  - Chips: “Historia”, “Comida”, “Fotos”, “Evitar filas”.
- Botón: “Agregar al día” en cada card.

Interacción:
- El usuario toca un card y ve detalles (duración, horario, mapa, precio).
- Si le gusta, toca “Agregar al día” y ese bloque se añade al timeline del Día 2.
- Puede ignorar la AI y usar un botón “Añadir actividad manual” para poner algo propio.

## Pantalla 4: Edición del día (drag & drop)

Objetivo: dar sensación de control total.

Elementos:
- Vista tipo agenda:
  - 9:00–12:00 Tour seleccionado.
  - 12:00–14:00 “Almuerzo libre (sin plan)”.
  - 15:00–18:00 Vacío (botón “Rellenar con ideas”).
- Detalle de cada bloque:
  - Arrastrable (drag & drop).
  - Icono de advertencia si logística no cuadra (p.ej. demasiado trayecto).
- Botón fijo: “Optimizar este día”.

Interacción:
- El usuario mueve las actividades, cambia horarios, elimina una si no la quiere.
- Si algo se rompe (p.ej. pone dos cosas que se solapan), el botón “Optimizar este día” ofrece:
  - “Ajustar horarios”.
  - “Sugerir alternativa cerca”.
- AI solo se activa cuando el usuario toca ese botón o pide sugerencias, no en cada movimiento.

## Dos modos visibles desde arriba

En casi todas las pantallas hay un conmutador:

- “Modo Manual (Experto)”:
  - La AI no genera automáticamente estructura ni sugerencias.
  - La AI solo aparece como botones puntuales: “Sugerir 3 actividades aquí” o “Optimizar este día”.
- “Modo Asistido (AI)”:
  - La AI crea la estructura inicial y propone listas cortas de actividades.
  - El usuario siempre puede editar todo.

Visualmente:
- En Modo Manual, el timeline empieza vacío, con botones “Agregar bloque”, “Agregar lugar”.
- En Modo Asistido, el timeline ya viene pre-llenado y la sensación es más de “revisar y ajustar”.

***