---
description: Reportar un bug con contexto completo
argument-hint: [descripción del bug]
allowed-tools: MCP(*), Bash(git log:*, git branch:*)
---

# Reportar Bug

## Contexto del Sistema:
- Rama actual: !`git branch --show-current`
- Último commit: !`git log -1 --oneline`

## Instrucciones:

1. Crear un issue de tipo "Bug" en Linear con:
   - Título: "🐛 $ARGUMENTS"
   - Prioridad: Alta (2) si menciona "crítico" o "urgente", Media (3) si no
   - Etiquetas: ["bug", "needs-investigation"]
   
2. En la descripción incluir:
   ```
   ## Descripción del Bug
   $ARGUMENTS
   
   ## Contexto
   - Rama: [rama actual]
   - Commit: [último commit]
   - Reportado por: [usuario actual]
   - Fecha: [fecha actual]
   
   ## Pasos para Reproducir
   [Por definir]
   
   ## Comportamiento Esperado
   [Por definir]
   ```

3. Asignar al equipo de desarrollo
4. Mover a "Todo" si es prioridad alta, sino dejar en "Backlog"

Mostrar el issue creado con su URL de Linear.