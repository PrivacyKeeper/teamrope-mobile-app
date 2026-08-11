-- 002 — Team roping event layer
--
-- Everything singular in the other apps is a pair here. The handicap number
-- is the organising principle of the sport, so classification gets first-
-- class treatment rather than living in a profile JSON blob.

CREATE TABLE IF NOT EXISTS public.horses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barn_name TEXT NOT NULL,
  registered_name TEXT,
  tr_role TEXT CHECK (tr_role IN ('head','heel','both','prospect')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- numeric(3,1) and never an integer: half numbers have been the industry
-- norm since the WSTR moved to an 18-point scale in 2010.
CREATE TABLE IF NOT EXISTS public.tr_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_code TEXT NOT NULL DEFAULT 'USTRC',
  -- A roper can hold a different number on each end. Two nullable columns,
  -- deliberately not one.
  header_number NUMERIC(3,1) CHECK (header_number BETWEEN 1 AND 9),
  heeler_number NUMERIC(3,1) CHECK (heeler_number BETWEEN 1 AND 10),
  elite BOOLEAN NOT NULL DEFAULT false,
  effective_from DATE NOT NULL DEFAULT current_date,
  effective_to DATE,
  source TEXT,
  UNIQUE (user_id, association_code, effective_from)
);

-- Floors and caps change by season, so they are rows rather than code.
CREATE TABLE IF NOT EXISTS public.tr_division_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_code TEXT NOT NULL,
  season INTEGER NOT NULL,
  division INTEGER NOT NULL,
  cap NUMERIC(3,1),
  floor_header_at_least NUMERIC(3,1),
  floor_heeler_at_least NUMERIC(3,1),
  elite_cap NUMERIC(3,1),
  UNIQUE (association_code, season, division)
);

CREATE TABLE IF NOT EXISTS public.tr_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  header_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  heeler_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Frozen at entry. A number moving mid-season must not retroactively
  -- change what division a team was eligible for.
  classification_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tr_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.tr_teams(id) ON DELETE CASCADE,
  rule_set_id UUID REFERENCES public.rule_sets(id),
  raw_time_ms INTEGER,
  official_time_ms INTEGER,
  head_catch TEXT CHECK (head_catch IN
    ('both_horns','half_head','neck','horn_hondo_cross','crossed_loop','bridle','leg','no_catch')),
  heel_catch TEXT CHECK (heel_catch IN ('two_feet','one_foot','front_foot','no_catch')),
  barrier_broken BOOLEAN NOT NULL DEFAULT false,
  crossfire BOOLEAN NOT NULL DEFAULT false,
  heeler_tied_on BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'clean',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partner finding is the highest-value feature in the app, so availability
-- is a real table rather than a free-text note on a profile.
CREATE TABLE IF NOT EXISTS public.tr_partner_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  end_preference TEXT NOT NULL CHECK (end_preference IN ('header','heeler','both')),
  available_from DATE,
  available_to DATE,
  travel_radius_mi INTEGER,
  home_region TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.horses                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tr_classifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tr_division_rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tr_teams                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tr_runs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tr_partner_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own horses" ON public.horses;
CREATE POLICY "Users manage own horses" ON public.horses FOR ALL
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
-- Numbers are public. The whole social system runs on knowing them.
DROP POLICY IF EXISTS "Classifications are public" ON public.tr_classifications;
CREATE POLICY "Classifications are public" ON public.tr_classifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users write own classification" ON public.tr_classifications;
CREATE POLICY "Users write own classification" ON public.tr_classifications FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Division rules are readable" ON public.tr_division_rules;
CREATE POLICY "Division rules are readable" ON public.tr_division_rules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Team members read their team" ON public.tr_teams;
CREATE POLICY "Team members read their team" ON public.tr_teams FOR SELECT
  USING (header_id = auth.uid() OR heeler_id = auth.uid());
DROP POLICY IF EXISTS "Team members write their team" ON public.tr_teams;
CREATE POLICY "Team members write their team" ON public.tr_teams FOR INSERT
  WITH CHECK (header_id = auth.uid() OR heeler_id = auth.uid());
DROP POLICY IF EXISTS "Team members read runs" ON public.tr_runs;
CREATE POLICY "Team members read runs" ON public.tr_runs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tr_teams t WHERE t.id = tr_runs.team_id
                 AND (t.header_id = auth.uid() OR t.heeler_id = auth.uid())));
DROP POLICY IF EXISTS "Availability is public" ON public.tr_partner_availability;
CREATE POLICY "Availability is public" ON public.tr_partner_availability FOR SELECT USING (active);
DROP POLICY IF EXISTS "Users manage own availability" ON public.tr_partner_availability;
CREATE POLICY "Users manage own availability" ON public.tr_partner_availability FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
