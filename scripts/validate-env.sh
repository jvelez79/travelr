#!/bin/bash
# =============================================================================
# validate-env.sh - Validación de variables de entorno para producción
# =============================================================================
# Uso: ./scripts/validate-env.sh
# Retorna exit code 1 si faltan variables críticas
# =============================================================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0

# =============================================================================
# Funciones de utilidad
# =============================================================================

check_required() {
    local var_name=$1
    local var_value=$(printenv "$var_name" 2>/dev/null || grep "^${var_name}=" .env.production 2>/dev/null | cut -d'=' -f2-)

    if [ -z "$var_value" ]; then
        echo -e "  ${RED}[ERROR]${NC} $var_name - No configurada"
        ((ERRORS++))
        return 1
    else
        echo -e "  ${GREEN}[OK]${NC} $var_name"
        return 0
    fi
}

check_recommended() {
    local var_name=$1
    local description=$2
    local var_value=$(printenv "$var_name" 2>/dev/null || grep "^${var_name}=" .env.production 2>/dev/null | cut -d'=' -f2-)

    if [ -z "$var_value" ]; then
        echo -e "  ${YELLOW}[WARN]${NC} $var_name - No configurada ($description)"
        ((WARNINGS++))
        return 1
    else
        echo -e "  ${GREEN}[OK]${NC} $var_name"
        return 0
    fi
}

check_url_format() {
    local var_name=$1
    local var_value=$(printenv "$var_name" 2>/dev/null || grep "^${var_name}=" .env.production 2>/dev/null | cut -d'=' -f2-)

    if [ -n "$var_value" ]; then
        if [[ ! "$var_value" =~ ^https:// ]]; then
            echo -e "  ${RED}[ERROR]${NC} $var_name debe usar HTTPS (actual: $var_value)"
            ((ERRORS++))
            return 1
        fi
    fi
    return 0
}

get_env_value() {
    local var_name=$1
    printenv "$var_name" 2>/dev/null || grep "^${var_name}=" .env.production 2>/dev/null | cut -d'=' -f2-
}

# =============================================================================
# Inicio de validación
# =============================================================================

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Validación de Variables de Entorno para Producción${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar si existe .env.production (solo si no hay variables de entorno ya cargadas)
if [ -z "$(printenv NEXT_PUBLIC_SUPABASE_URL)" ] && [ ! -f ".env.production" ]; then
    echo -e "${RED}[ERROR] No se encontró .env.production y no hay variables de entorno cargadas${NC}"
    echo -e "Crea el archivo .env.production basándote en .env.example"
    exit 1
fi

# =============================================================================
# Variables Críticas - Supabase
# =============================================================================

echo -e "${YELLOW}Supabase (Críticas):${NC}"
check_required "NEXT_PUBLIC_SUPABASE_URL"
check_url_format "NEXT_PUBLIC_SUPABASE_URL"
check_required "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_required "SUPABASE_SERVICE_ROLE_KEY"
echo ""

# =============================================================================
# Variables Críticas - Google
# =============================================================================

echo -e "${YELLOW}Google Maps & Places (Críticas):${NC}"
check_required "GOOGLE_PLACES_API_KEY"
check_required "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
echo ""

# =============================================================================
# Variables Críticas - Admin
# =============================================================================

echo -e "${YELLOW}Admin (Críticas):${NC}"
check_required "ADMIN_EMAILS"
check_required "NEXT_PUBLIC_ADMIN_EMAILS"
echo ""

# =============================================================================
# Variables AI - Según proveedor
# =============================================================================

echo -e "${YELLOW}AI Provider:${NC}"
AI_PROVIDER=$(get_env_value "AI_PROVIDER")

if [ -z "$AI_PROVIDER" ]; then
    echo -e "  ${YELLOW}[WARN]${NC} AI_PROVIDER no definido, asumiendo 'anthropic'"
    AI_PROVIDER="anthropic"
    ((WARNINGS++))
else
    echo -e "  ${GREEN}[OK]${NC} AI_PROVIDER = $AI_PROVIDER"
fi

case "$AI_PROVIDER" in
    "anthropic")
        echo -e "${YELLOW}  Anthropic (Requeridas para AI_PROVIDER=anthropic):${NC}"
        check_required "ANTHROPIC_API_KEY"
        check_recommended "ANTHROPIC_MODEL" "modelo de Anthropic a usar"
        ;;
    "openai")
        echo -e "${YELLOW}  OpenAI (Requeridas para AI_PROVIDER=openai):${NC}"
        check_required "OPENAI_API_KEY"
        check_recommended "OPENAI_MODEL" "modelo de OpenAI a usar"
        ;;
    "claude-cli")
        echo -e "  ${GREEN}[OK]${NC} claude-cli no requiere API keys adicionales"
        ;;
    *)
        echo -e "  ${RED}[ERROR]${NC} AI_PROVIDER='$AI_PROVIDER' no es válido (usar: anthropic, openai, claude-cli)"
        ((ERRORS++))
        ;;
esac
echo ""

# =============================================================================
# Variables Recomendadas
# =============================================================================

echo -e "${YELLOW}Variables Recomendadas:${NC}"
check_recommended "RESEND_API_KEY" "emails de confirmación de vuelos/alojamientos"
check_recommended "RESEND_WEBHOOK_SECRET" "validación de webhooks entrantes"
check_recommended "SERPAPI_API_KEY" "búsqueda de hoteles"
echo ""

# =============================================================================
# Resumen
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Resumen${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}  ERRORES: $ERRORS variable(s) crítica(s) faltante(s)${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}  ADVERTENCIAS: $WARNINGS variable(s) recomendada(s) faltante(s)${NC}"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}  Todas las variables están configuradas correctamente${NC}"
fi

echo ""

# Exit con error si hay variables críticas faltantes
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Deploy bloqueado: Configura las variables faltantes antes de continuar${NC}"
    exit 1
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Puedes continuar, pero algunas funcionalidades podrían no estar disponibles${NC}"
fi

echo -e "${GREEN}Validación completada exitosamente${NC}"
exit 0
