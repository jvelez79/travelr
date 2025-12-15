---
description: Mover un issue a una columna específica del tablero Kanban
argument-hint: [issue-id] [columna: backlog|todo|in-progress|review|done]
allowed-tools: MCP(*)
---

# Mover Issue en Kanban

Mover el issue $1 a la columna $2.

## Mapeo de columnas:
- backlog → "Backlog"
- todo → "Todo"  
- in-progress → "In Progress"
- review → "In Review"
- done → "Done"

## Instrucciones:

1. Buscar el issue por su ID ($1)
2. Obtener los estados disponibles del equipo
3. Encontrar el estado que corresponde a la columna $2
4. Actualizar el issue con el nuevo estado
5. Si se mueve a "In Progress":
   - Asignar al usuario actual si no tiene asignado
   - Agregar comentario: "Trabajo iniciado"
6. Si se mueve a "Done":
   - Agregar comentario: "Completado"
   - Verificar si hay sub-issues pendientes

Confirmar el movimiento mostrando el nuevo estado.