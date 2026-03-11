-- ============================================================
-- Migración: Imputación de gastos a ítems de presupuesto
-- Tabla afectada: expenses
-- Descripción: Agrega columna budget_item_id (nullable) que
--              permite vincular un gasto a un ítem del
--              presupuesto aprobado para control financiero.
-- ============================================================

BEGIN;

-- 1. Agregar columna (nullable, no rompe datos existentes)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS budget_item_id TEXT;

-- 2. Foreign key hacia budget_items (SET NULL en borrado del ítem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints
    WHERE  constraint_name = 'fk_expenses_budget_item'
      AND  table_name      = 'expenses'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT fk_expenses_budget_item
      FOREIGN KEY (budget_item_id)
      REFERENCES budget_items(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Índice para acelerar joins en el reporte de control presupuestario
CREATE INDEX IF NOT EXISTS expenses_budget_item_id_idx
  ON expenses(budget_item_id);

COMMIT;

-- Verificación (ejecutar por separado para confirmar)
-- SELECT column_name, data_type, is_nullable
-- FROM   information_schema.columns
-- WHERE  table_name = 'expenses'
--   AND  column_name = 'budget_item_id';
