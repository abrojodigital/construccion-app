-- ============================================================
-- Migración: Refactorización de imputación presupuestaria en gastos
-- Versión: 2025-03 (rev 2: agrega task_id a expense_items)
-- Descripción:
--   1. Agrega columna stage_id a expenses (vinculación con rubro)
--   2. Crea tabla expense_items para detalle de ítems por gasto
--      con task_id (vinculación a tarea) y budget_item_id
--   3. Migra datos existentes de expenses.budget_item_id a expense_items
--   4. Elimina columnas budget_item_id y budget_id de expenses
--      (obsoletas luego de la migración)
--
-- Es seguro correr en una BD vacía y en una con datos.
-- Idempotente: usa IF NOT EXISTS / IF EXISTS en cada paso.
-- También cubre sistemas que ya corrieron la versión anterior
-- del script (tabla existe pero sin task_id).
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. Agregar stage_id a expenses (nullable, no rompe datos)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS stage_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_expenses_stage'
      AND table_name = 'expenses'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT fk_expenses_stage
      FOREIGN KEY (stage_id)
      REFERENCES stages(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS expenses_stage_id_idx
  ON expenses(stage_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Crear tabla expense_items (con task_id desde el inicio)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_items (
  id             TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  description    TEXT,
  amount         DECIMAL(15,2) NOT NULL,
  expense_id     TEXT          NOT NULL,
  task_id        TEXT,
  budget_item_id TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT expense_items_pkey PRIMARY KEY (id),
  CONSTRAINT fk_expense_items_expense
    FOREIGN KEY (expense_id)
    REFERENCES expenses(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_expense_items_task
    FOREIGN KEY (task_id)
    REFERENCES tasks(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_expense_items_budget_item
    FOREIGN KEY (budget_item_id)
    REFERENCES budget_items(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS expense_items_expense_id_idx
  ON expense_items(expense_id);

CREATE INDEX IF NOT EXISTS expense_items_task_id_idx
  ON expense_items(task_id);

CREATE INDEX IF NOT EXISTS expense_items_budget_item_id_idx
  ON expense_items(budget_item_id);

-- ─────────────────────────────────────────────────────────────
-- 2b. Agregar task_id si la tabla ya existía de una versión
--     anterior del script (sin esa columna)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_items' AND column_name = 'task_id'
  ) THEN
    ALTER TABLE expense_items ADD COLUMN task_id TEXT;

    ALTER TABLE expense_items
      ADD CONSTRAINT fk_expense_items_task
      FOREIGN KEY (task_id)
      REFERENCES tasks(id)
      ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS expense_items_task_id_idx
      ON expense_items(task_id);

    RAISE NOTICE 'Columna task_id agregada a expense_items (tabla preexistente).';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. Migrar datos: expenses.budget_item_id → expense_items
--    Se migra solo si la columna todavía existe en la tabla
--    (por si la migración se corre dos veces).
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses'
      AND column_name = 'budget_item_id'
  ) THEN
    INSERT INTO expense_items (id, expense_id, budget_item_id, amount, created_at)
    SELECT
      gen_random_uuid()::text,
      e.id,
      e.budget_item_id,
      e.total_amount,   -- monto total del gasto como referencia
      NOW()
    FROM expenses e
    WHERE e.budget_item_id IS NOT NULL
      AND e.deleted_at IS NULL
      -- evitar duplicados si se corre dos veces
      AND NOT EXISTS (
        SELECT 1 FROM expense_items ei
        WHERE ei.expense_id = e.id
          AND ei.budget_item_id = e.budget_item_id
      );

    RAISE NOTICE 'Datos migrados de expenses.budget_item_id a expense_items.';
  ELSE
    RAISE NOTICE 'Columna budget_item_id ya no existe en expenses. Migración de datos omitida.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 4. Eliminar columnas obsoletas de expenses
-- ─────────────────────────────────────────────────────────────

-- budget_item_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'budget_item_id'
  ) THEN
    -- Eliminar FK e índice asociados si existen
    ALTER TABLE expenses
      DROP CONSTRAINT IF EXISTS fk_expenses_budget_item;

    DROP INDEX IF EXISTS expenses_budget_item_id_idx;

    ALTER TABLE expenses
      DROP COLUMN budget_item_id;

    RAISE NOTICE 'Columna budget_item_id eliminada de expenses.';
  END IF;
END $$;

-- budget_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'budget_id'
  ) THEN
    ALTER TABLE expenses
      DROP CONSTRAINT IF EXISTS expenses_budget_id_fkey;

    ALTER TABLE expenses
      DROP COLUMN budget_id;

    RAISE NOTICE 'Columna budget_id eliminada de expenses.';
  END IF;
END $$;

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- Verificación (ejecutar por separado para confirmar)
-- ─────────────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'expenses'
-- ORDER BY ordinal_position;
--
-- SELECT count(*) FROM expense_items;
