-- ================================================
-- TRA-54: Habilitar Row Level Security (RLS)
-- ================================================

-- 1. Habilitar RLS en las tablas
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_states ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas CRUD para usuarios autenticados
-- Nota: Usar (select auth.uid()) en lugar de auth.uid() para mejor rendimiento

CREATE POLICY "Users can CRUD own trips"
  ON trips
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own plans"
  ON plans
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can CRUD own generation_states"
  ON generation_states
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 3. Agregar índice faltante para optimizar RLS en plans
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans USING btree (user_id);
