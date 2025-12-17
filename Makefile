# =============================================================================
# Travelr - Makefile
# =============================================================================
# Comandos para gestión de ambiente local y deployment
# Uso: make <comando>
# =============================================================================

# Configuración
PROJECT_REF := jdmcvizlbnikopkwzfdy
SUPABASE := npx supabase
LOGS_DIR := .logs

# Colores
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help up down restart supabase functions dev logs logs-functions logs-next status db-reset db-migrate deploy deploy-db deploy-functions secrets clean

# =============================================================================
# AYUDA
# =============================================================================

help: ## Muestra esta ayuda
	@echo ""
	@echo "$(BLUE)Travelr - Comandos disponibles$(NC)"
	@echo "================================"
	@echo ""
	@echo "$(GREEN)Desarrollo Local:$(NC)"
	@echo "  make up              Inicia TODO (Supabase + Functions + Next.js)"
	@echo "  make down            Detiene TODOS los servicios"
	@echo "  make restart         Reinicia todo el ambiente"
	@echo "  make logs            Muestra todos los logs (tail -f)"
	@echo "  make logs-functions  Solo logs de Edge Functions"
	@echo "  make logs-next       Solo logs de Next.js"
	@echo "  make status          Muestra estado de Supabase"
	@echo ""
	@echo "$(GREEN)Servicios individuales:$(NC)"
	@echo "  make supabase        Solo inicia Supabase"
	@echo "  make functions       Solo sirve Edge Functions (foreground)"
	@echo "  make dev             Solo inicia Next.js (foreground)"
	@echo ""
	@echo "$(GREEN)Base de Datos:$(NC)"
	@echo "  make db-reset        Resetea la base de datos local"
	@echo "  make db-migrate      Aplica migraciones pendientes"
	@echo "  make db-diff         Genera migración desde cambios en DB"
	@echo ""
	@echo "$(GREEN)Producción:$(NC)"
	@echo "  make deploy          Deploy completo (db + functions)"
	@echo "  make deploy-db       Solo push de migraciones"
	@echo "  make deploy-functions Solo deploy de Edge Functions"
	@echo "  make secrets         Configura secretos en producción"
	@echo ""
	@echo "$(GREEN)Utilidades:$(NC)"
	@echo "  make clean           Limpia archivos temporales y logs"
	@echo "  make studio          Abre Supabase Studio"
	@echo ""

# =============================================================================
# DESARROLLO LOCAL - AUTOMATIZADO
# =============================================================================

up: ## Inicia TODO: Supabase + Edge Functions + Next.js
	@echo "$(GREEN)═══════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  Iniciando ambiente de desarrollo...$(NC)"
	@echo "$(GREEN)═══════════════════════════════════════════$(NC)"
	@mkdir -p $(LOGS_DIR)
	@echo ""
	@echo "$(YELLOW)[1/3] Iniciando Supabase...$(NC)"
	@$(SUPABASE) start
	@echo ""
	@echo "$(YELLOW)[2/3] Iniciando Edge Functions (background)...$(NC)"
	@$(SUPABASE) functions serve --env-file ./supabase/.env > $(LOGS_DIR)/functions.log 2>&1 & echo $$! > $(LOGS_DIR)/functions.pid
	@sleep 2
	@echo "      PID: $$(cat $(LOGS_DIR)/functions.pid)"
	@echo ""
	@echo "$(YELLOW)[3/3] Iniciando Next.js (background)...$(NC)"
	@npm run dev > $(LOGS_DIR)/next.log 2>&1 & echo $$! > $(LOGS_DIR)/next.pid
	@sleep 3
	@echo "      PID: $$(cat $(LOGS_DIR)/next.pid)"
	@echo ""
	@echo "$(GREEN)═══════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  ✓ Todo iniciado correctamente$(NC)"
	@echo "$(GREEN)═══════════════════════════════════════════$(NC)"
	@echo ""
	@echo "  $(BLUE)App:$(NC)        http://localhost:3333"
	@echo "  $(BLUE)Studio:$(NC)     http://localhost:54323"
	@echo "  $(BLUE)API:$(NC)        http://localhost:54321"
	@echo "  $(BLUE)Functions:$(NC)  http://localhost:54321/functions/v1"
	@echo ""
	@echo "  $(YELLOW)Logs:$(NC)       make logs"
	@echo "  $(YELLOW)Detener:$(NC)    make down"
	@echo ""

down: ## Detiene TODOS los servicios
	@echo "$(YELLOW)Deteniendo todos los servicios...$(NC)"
	@-if [ -f $(LOGS_DIR)/next.pid ]; then \
		kill $$(cat $(LOGS_DIR)/next.pid) 2>/dev/null; \
		rm -f $(LOGS_DIR)/next.pid; \
		echo "  ✓ Next.js detenido"; \
	fi
	@-if [ -f $(LOGS_DIR)/functions.pid ]; then \
		kill $$(cat $(LOGS_DIR)/functions.pid) 2>/dev/null; \
		rm -f $(LOGS_DIR)/functions.pid; \
		echo "  ✓ Edge Functions detenidas"; \
	fi
	@-killall -q node 2>/dev/null || true
	@$(SUPABASE) stop --no-backup
	@echo "$(GREEN)Todos los servicios detenidos$(NC)"

restart: ## Reinicia todo el ambiente
	@$(MAKE) down
	@sleep 2
	@$(MAKE) up

# =============================================================================
# LOGS
# =============================================================================

logs: ## Muestra todos los logs en tiempo real
	@echo "$(BLUE)Logs en tiempo real (Ctrl+C para salir)$(NC)"
	@echo "$(YELLOW)═══ Functions ═══$(NC)" && tail -f $(LOGS_DIR)/functions.log 2>/dev/null & \
	echo "$(YELLOW)═══ Next.js ═══$(NC)" && tail -f $(LOGS_DIR)/next.log 2>/dev/null & \
	wait

logs-functions: ## Solo logs de Edge Functions
	@echo "$(BLUE)Logs de Edge Functions (Ctrl+C para salir)$(NC)"
	@tail -f $(LOGS_DIR)/functions.log 2>/dev/null || echo "$(RED)No hay logs. ¿Está corriendo? (make up)$(NC)"

logs-next: ## Solo logs de Next.js
	@echo "$(BLUE)Logs de Next.js (Ctrl+C para salir)$(NC)"
	@tail -f $(LOGS_DIR)/next.log 2>/dev/null || echo "$(RED)No hay logs. ¿Está corriendo? (make up)$(NC)"

# =============================================================================
# SERVICIOS INDIVIDUALES (foreground - para debug)
# =============================================================================

supabase: ## Solo inicia Supabase
	@echo "$(GREEN)Iniciando Supabase...$(NC)"
	@$(SUPABASE) start

functions: ## Sirve Edge Functions (foreground)
	@echo "$(GREEN)Sirviendo Edge Functions...$(NC)"
	@$(SUPABASE) functions serve --env-file ./supabase/.env

dev: ## Solo inicia Next.js (foreground)
	@echo "$(GREEN)Iniciando Next.js en puerto 3333...$(NC)"
	@npm run dev

status: ## Muestra estado de Supabase
	@$(SUPABASE) status
	@echo ""
	@echo "$(BLUE)Procesos en background:$(NC)"
	@if [ -f $(LOGS_DIR)/functions.pid ]; then \
		echo "  Functions PID: $$(cat $(LOGS_DIR)/functions.pid)"; \
	else \
		echo "  Functions: $(RED)no running$(NC)"; \
	fi
	@if [ -f $(LOGS_DIR)/next.pid ]; then \
		echo "  Next.js PID: $$(cat $(LOGS_DIR)/next.pid)"; \
	else \
		echo "  Next.js: $(RED)no running$(NC)"; \
	fi

studio: ## Abre Supabase Studio
	@xdg-open http://localhost:54323 2>/dev/null || open http://localhost:54323 2>/dev/null || echo "Abre http://localhost:54323"

# =============================================================================
# BASE DE DATOS
# =============================================================================

db-reset: ## Resetea la base de datos local
	@echo "$(YELLOW)Reseteando base de datos...$(NC)"
	@$(SUPABASE) db reset
	@echo "$(GREEN)Base de datos reseteada$(NC)"

db-migrate: ## Aplica migraciones pendientes
	@echo "$(YELLOW)Aplicando migraciones...$(NC)"
	@$(SUPABASE) migration up
	@echo "$(GREEN)Migraciones aplicadas$(NC)"

db-diff: ## Genera migración desde cambios en la DB
	@echo "$(YELLOW)Generando migración desde diferencias...$(NC)"
	@read -p "Nombre de la migración: " name; \
	$(SUPABASE) db diff -f $$name
	@echo "$(GREEN)Migración generada$(NC)"

# =============================================================================
# PRODUCCIÓN
# =============================================================================

deploy: secrets deploy-db deploy-functions ## Deploy completo (secrets + db + functions)
	@echo "$(GREEN)Deploy completo finalizado$(NC)"

deploy-db: ## Push de migraciones a producción
	@echo "$(YELLOW)Pusheando migraciones a producción...$(NC)"
	@$(SUPABASE) db push --project-ref $(PROJECT_REF)
	@echo "$(GREEN)Migraciones aplicadas en producción$(NC)"

deploy-functions: ## Deploy de Edge Functions a producción
	@echo "$(YELLOW)Deployando Edge Functions...$(NC)"
	@$(SUPABASE) functions deploy --project-ref $(PROJECT_REF)
	@echo "$(GREEN)Edge Functions deployadas$(NC)"

secrets: ## Configura secretos en producción
	@if [ -f supabase/.env.production ]; then \
		echo "$(YELLOW)Configurando secretos en producción...$(NC)"; \
		$(SUPABASE) secrets set --env-file ./supabase/.env.production --project-ref $(PROJECT_REF); \
		echo "$(GREEN)Secretos configurados$(NC)"; \
	else \
		echo "$(RED)Error: No existe supabase/.env.production$(NC)"; \
		exit 1; \
	fi

secrets-list: ## Lista los secretos en producción
	@$(SUPABASE) secrets list --project-ref $(PROJECT_REF)

# =============================================================================
# UTILIDADES
# =============================================================================

clean: ## Limpia archivos temporales y logs
	@echo "$(YELLOW)Limpiando...$(NC)"
	@rm -rf .next
	@rm -rf node_modules/.cache
	@rm -rf supabase/.temp
	@rm -rf $(LOGS_DIR)
	@echo "$(GREEN)Limpieza completada$(NC)"

install: ## Instala dependencias
	@npm install

# Default
.DEFAULT_GOAL := help
