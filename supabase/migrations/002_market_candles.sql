
-- =====================================================
-- CASSIUS EA SUITE
-- MARKET DATA FOUNDATION v1.0
-- =====================================================

CREATE TABLE IF NOT EXISTS public.market_candles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    instrument TEXT NOT NULL,
    timeframe TEXT NOT NULL,

    open_time TIMESTAMPTZ NOT NULL,

    open_price NUMERIC(20, 8) NOT NULL CHECK (open_price > 0),
    high_price NUMERIC(20, 8) NOT NULL CHECK (high_price > 0),
    low_price NUMERIC(20, 8) NOT NULL CHECK (low_price > 0),
    close_price NUMERIC(20, 8) NOT NULL CHECK (close_price > 0),

    volume NUMERIC(24, 8) NOT NULL DEFAULT 0
        CHECK (volume >= 0),

    data_source TEXT NOT NULL DEFAULT 'historical',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_candle_prices CHECK (
        high_price >= low_price
        AND high_price >= open_price
        AND high_price >= close_price
        AND low_price <= open_price
        AND low_price <= close_price
    ),

    CONSTRAINT unique_market_candle
        UNIQUE (instrument, timeframe, open_time)
);

-- INDEXES

CREATE INDEX IF NOT EXISTS market_candles_lookup_idx
ON public.market_candles (
    instrument,
    timeframe,
    open_time DESC
);

-- SECURITY

ALTER TABLE public.market_candles
ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read market data.

DROP POLICY IF EXISTS "Authenticated users read market candles"
ON public.market_candles;

CREATE POLICY "Authenticated users read market candles"
ON public.market_candles
FOR SELECT
TO authenticated
USING (true);

-- No client-side INSERT, UPDATE or DELETE policies.
-- Trusted backend processes will manage market data.

-- =====================================================
-- END MARKET DATA FOUNDATION
-- =====================================================
