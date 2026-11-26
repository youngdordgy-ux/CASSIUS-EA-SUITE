
-- =====================================================
-- CASSIUS EA SUITE
-- DATABASE FOUNDATION v1.0
-- SUPABASE POSTGRESQL
-- =====================================================

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id)
        ON DELETE CASCADE,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id)
        ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'dark'
        CHECK (theme IN ('dark', 'light')),
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STRATEGIES
CREATE TABLE IF NOT EXISTS public.strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
        ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    instrument TEXT,
    timeframe TEXT,
    configuration JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. MARKET OBSERVATIONS
CREATE TABLE IF NOT EXISTS public.signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
        ON DELETE CASCADE,
    strategy_id UUID REFERENCES public.strategies(id)
        ON DELETE SET NULL,
    instrument TEXT NOT NULL,
    timeframe TEXT,
    observation_type TEXT NOT NULL
        CHECK (
            observation_type IN (
                'trend',
                'breakout',
                'reversal',
                'range',
                'other'
            )
        ),
    summary TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SIMULATED TRADES ONLY
CREATE TABLE IF NOT EXISTS public.demo_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
        ON DELETE CASCADE,
    strategy_id UUID REFERENCES public.strategies(id)
        ON DELETE SET NULL,
    instrument TEXT NOT NULL,
    direction TEXT NOT NULL
        CHECK (direction IN ('long', 'short')),
    entry_price NUMERIC(20, 8) NOT NULL
        CHECK (entry_price > 0),
    exit_price NUMERIC(20, 8)
        CHECK (exit_price IS NULL OR exit_price > 0),
    quantity NUMERIC(20, 8) NOT NULL
        CHECK (quantity > 0),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT demo_trade_close_state CHECK (
        (status = 'open' AND closed_at IS NULL AND exit_price IS NULL)
        OR
        (status = 'closed' AND closed_at IS NOT NULL AND exit_price IS NOT NULL)
    )
);

-- 6. BACKTEST RESULTS
CREATE TABLE IF NOT EXISTS public.backtest_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
        ON DELETE CASCADE,
    strategy_id UUID REFERENCES public.strategies(id)
        ON DELETE SET NULL,
    instrument TEXT NOT NULL,
    timeframe TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    starting_balance NUMERIC(20, 2) NOT NULL
        CHECK (starting_balance > 0),
    ending_balance NUMERIC(20, 2),
    total_trades INTEGER NOT NULL DEFAULT 0
        CHECK (total_trades >= 0),
    results JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_backtest_dates CHECK (end_date >= start_date)
);

-- 7. WATCHLIST
CREATE TABLE IF NOT EXISTS public.watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
        ON DELETE CASCADE,
    instrument TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, instrument)
);

-- =====================================================
-- AUTOMATIC UPDATED_AT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- UPDATED_AT TRIGGERS

DROP TRIGGER IF EXISTS profiles_updated_at
ON public.profiles;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS settings_updated_at
ON public.user_settings;

CREATE TRIGGER settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS strategies_updated_at
ON public.strategies;

CREATE TRIGGER strategies_updated_at
BEFORE UPDATE ON public.strategies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- AUTOMATIC PROFILE CREATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            NEW.raw_user_meta_data ->> 'name'
        )
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DATABASE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS strategies_user_idx
ON public.strategies(user_id);

CREATE INDEX IF NOT EXISTS signals_user_idx
ON public.signals(user_id);

CREATE INDEX IF NOT EXISTS signals_strategy_idx
ON public.signals(strategy_id);

CREATE INDEX IF NOT EXISTS demo_trades_user_idx
ON public.demo_trades(user_id);

CREATE INDEX IF NOT EXISTS backtest_runs_user_idx
ON public.backtest_runs(user_id);

CREATE INDEX IF NOT EXISTS watchlist_user_idx
ON public.watchlist_items(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- PROFILES

DROP POLICY IF EXISTS "Users view own profile"
ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users update own profile"
ON public.profiles;

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

-- USER SETTINGS

DROP POLICY IF EXISTS "Users manage own settings"
ON public.user_settings;

CREATE POLICY "Users manage own settings"
ON public.user_settings FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- STRATEGIES

DROP POLICY IF EXISTS "Users manage own strategies"
ON public.strategies;

CREATE POLICY "Users manage own strategies"
ON public.strategies FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- SIGNALS

DROP POLICY IF EXISTS "Users manage own signals"
ON public.signals;

CREATE POLICY "Users manage own signals"
ON public.signals FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- DEMO TRADES

DROP POLICY IF EXISTS "Users manage own demo trades"
ON public.demo_trades;

CREATE POLICY "Users manage own demo trades"
ON public.demo_trades FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- BACKTEST RUNS

DROP POLICY IF EXISTS "Users manage own backtests"
ON public.backtest_runs;

CREATE POLICY "Users manage own backtests"
ON public.backtest_runs FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- WATCHLIST

DROP POLICY IF EXISTS "Users manage own watchlist"
ON public.watchlist_items;

CREATE POLICY "Users manage own watchlist"
ON public.watchlist_items FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- =====================================================
-- END OF CASSIUS EA SUITE DATABASE FOUNDATION
-- =====================================================
