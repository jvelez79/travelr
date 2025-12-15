---
description: Buscar TODOs en el código y convertirlos en issues
allowed-tools: MCP(*), Bash(grep:*), Glob(*)
---

# Convertir TODOs en Issues

## Instrucciones:

1. Buscar todos los comentarios TODO en el proyecto:
   ```bash
   grep -r "TODO\|FIXME\|HACK" --include="*.php" --include="*.js" --include="*.ts" --include="*.twig" src/ templates/
   ```

2. Para cada TODO encontrado:
   - Extraer el comentario
   - Identificar el archivo y línea
   - Crear un issue en Linear con:
     - Título: contenido del TODO
     - Descripción: incluir contexto del archivo y línea
     - Etiqueta: "tech-debt"
     - Prioridad: Baja (4)

3. Mostrar un resumen de todos los issues creados

4. Opcional: Actualizar los comentarios TODO para incluir el ID del issue:
   ```
   // TODO [LIN-123]: Refactorizar esta función
   ```