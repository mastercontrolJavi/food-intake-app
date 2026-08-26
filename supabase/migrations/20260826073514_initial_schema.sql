begin;

create extension if not exists btree_gist with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 80),
  preferred_unit_system text not null default 'metric' check (preferred_unit_system in ('metric', 'imperial')),
  height_cm numeric(6,2) check (height_cm is null or height_cm between 50 and 300),
  goal_weight_kg numeric(6,2) check (goal_weight_kg is null or goal_weight_kg between 20 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  effective_from date not null,
  effective_until date,
  primary_goal text not null default 'maintain' check (primary_goal in ('maintain', 'lose', 'gain', 'performance', 'custom')),
  calorie_target numeric(8,2) check (calorie_target is null or calorie_target > 0),
  protein_target_g numeric(8,2) check (protein_target_g is null or protein_target_g > 0),
  carbs_target_g numeric(8,2) check (carbs_target_g is null or carbs_target_g > 0),
  fat_target_g numeric(8,2) check (fat_target_g is null or fat_target_g > 0),
  fiber_target_g numeric(8,2) check (fiber_target_g is null or fiber_target_g > 0),
  sodium_limit_mg numeric(9,2) check (sodium_limit_mg is null or sodium_limit_mg > 0),
  added_sugar_limit_g numeric(8,2) check (added_sugar_limit_g is null or added_sugar_limit_g > 0),
  water_target_ml integer check (water_target_ml is null or water_target_ml > 0),
  step_target integer check (step_target is null or step_target > 0),
  weekly_workout_target integer check (weekly_workout_target is null or weekly_workout_target between 1 and 21),
  late_meal_time time not null default '20:00',
  created_at timestamptz not null default now(),
  constraint user_goals_effective_range_check check (effective_until is null or effective_until > effective_from),
  constraint user_goals_no_overlap exclude using gist (
    user_id with =,
    daterange(effective_from, coalesce(effective_until, 'infinity'::date), '[)') with &&
  )
);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_kg numeric(6,2) check (weight_kg is null or weight_kg between 20 and 500),
  body_fat_pct numeric(5,2) check (body_fat_pct is null or body_fat_pct between 1 and 75),
  waist_cm numeric(6,2) check (waist_cm is null or waist_cm between 20 and 300),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  constraint body_measurements_has_value check (weight_kg is not null or body_fat_pct is not null or waist_cm is not null)
);

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_at timestamptz not null default now(),
  meal_type text check (meal_type is null or meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  source_type text check (source_type is null or source_type in ('home', 'restaurant', 'takeout', 'fast_food', 'packaged', 'snack', 'other')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  raw_description text check (raw_description is null or char_length(raw_description) <= 1000),
  restaurant_name text check (restaurant_name is null or char_length(restaurant_name) <= 160),
  portion_description text check (portion_description is null or char_length(portion_description) <= 160),
  quantity numeric(8,3) not null default 1 check (quantity > 0 and quantity <= 1000),
  calories numeric(9,2) check (calories is null or calories >= 0),
  protein_g numeric(9,2) check (protein_g is null or protein_g >= 0),
  carbs_g numeric(9,2) check (carbs_g is null or carbs_g >= 0),
  fat_g numeric(9,2) check (fat_g is null or fat_g >= 0),
  fiber_g numeric(9,2) check (fiber_g is null or fiber_g >= 0),
  sodium_mg numeric(10,2) check (sodium_mg is null or sodium_mg >= 0),
  added_sugar_g numeric(9,2) check (added_sugar_g is null or added_sugar_g >= 0),
  nutrition_source text not null default 'manual' check (nutrition_source in ('manual', 'custom_food', 'saved_meal', 'repeat', 'usda', 'unknown')),
  nutrition_external_id text,
  nutrition_confidence text not null default 'unknown' check (nutrition_confidence in ('high', 'medium', 'low', 'unknown')),
  meal_score numeric(5,2) check (meal_score is null or meal_score between 0 and 100),
  score_breakdown jsonb not null default '{}'::jsonb,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  portion_description text,
  calories numeric(9,2) check (calories is null or calories >= 0),
  protein_g numeric(9,2) check (protein_g is null or protein_g >= 0),
  carbs_g numeric(9,2) check (carbs_g is null or carbs_g >= 0),
  fat_g numeric(9,2) check (fat_g is null or fat_g >= 0),
  fiber_g numeric(9,2) check (fiber_g is null or fiber_g >= 0),
  sodium_mg numeric(10,2) check (sodium_mg is null or sodium_mg >= 0),
  added_sugar_g numeric(9,2) check (added_sugar_g is null or added_sugar_g >= 0),
  created_at timestamptz not null default now()
);

create table public.custom_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  serving_description text check (serving_description is null or char_length(serving_description) <= 160),
  calories numeric(9,2) check (calories is null or calories >= 0),
  protein_g numeric(9,2) check (protein_g is null or protein_g >= 0),
  carbs_g numeric(9,2) check (carbs_g is null or carbs_g >= 0),
  fat_g numeric(9,2) check (fat_g is null or fat_g >= 0),
  fiber_g numeric(9,2) check (fiber_g is null or fiber_g >= 0),
  sodium_mg numeric(10,2) check (sodium_mg is null or sodium_mg >= 0),
  added_sugar_g numeric(9,2) check (added_sugar_g is null or added_sugar_g >= 0),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  source_type text check (source_type is null or source_type in ('home', 'restaurant', 'takeout', 'fast_food', 'packaged', 'snack', 'other')),
  restaurant_name text,
  portion_description text,
  calories numeric(9,2) check (calories is null or calories >= 0),
  protein_g numeric(9,2) check (protein_g is null or protein_g >= 0),
  carbs_g numeric(9,2) check (carbs_g is null or carbs_g >= 0),
  fat_g numeric(9,2) check (fat_g is null or fat_g >= 0),
  fiber_g numeric(9,2) check (fiber_g is null or fiber_g >= 0),
  sodium_mg numeric(10,2) check (sodium_mg is null or sodium_mg >= 0),
  added_sugar_g numeric(9,2) check (added_sugar_g is null or added_sugar_g >= 0),
  is_favorite boolean not null default false,
  use_count integer not null default 0 check (use_count >= 0),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consumed_at timestamptz not null default now(),
  drink_type text not null default 'water' check (drink_type in ('water', 'sparkling_water', 'coffee', 'tea', 'soda', 'juice', 'energy_drink', 'milk', 'sports_drink', 'alcoholic_drink', 'other')),
  volume_ml integer not null check (volume_ml > 0 and volume_ml <= 20000),
  calories numeric(9,2) check (calories is null or calories >= 0),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  activity_type text not null check (activity_type in ('steps', 'walking', 'running', 'gym', 'weights', 'cycling', 'sport', 'hiking', 'swimming', 'other')),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 0 and 1440),
  steps integer check (steps is null or steps >= 0),
  distance_km numeric(8,3) check (distance_km is null or distance_km >= 0),
  estimated_calories_burned numeric(9,2) check (estimated_calories_burned is null or estimated_calories_burned >= 0),
  intensity text check (intensity is null or intensity in ('low', 'moderate', 'high')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_logs_has_value check (duration_minutes is not null or steps is not null or distance_km is not null or estimated_calories_burned is not null)
);

create table public.day_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_date),
  constraint day_status_completion_check check ((completed and completed_at is not null) or (not completed))
);

create table public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  goal_id uuid references public.user_goals(id) on delete set null,
  score numeric(5,2) not null check (score between 0 and 100),
  grade text check (grade is null or grade in ('A', 'B', 'C', 'D', 'F')),
  confidence text not null check (confidence in ('high', 'medium', 'low', 'insufficient')),
  coverage_ratio numeric(6,5) not null check (coverage_ratio between 0 and 1),
  scoring_algorithm_version text not null,
  goal_snapshot jsonb not null,
  metric_scores jsonb not null,
  daily_totals jsonb not null,
  top_strength text,
  top_opportunity text,
  generated_summary text not null,
  is_stale boolean not null default false,
  completed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (user_id, local_date)
);

create table public.period_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('week', 'month')),
  period_start date not null,
  period_end date not null,
  score numeric(5,2) check (score is null or score between 0 and 100),
  confidence text not null check (confidence in ('high', 'medium', 'low', 'insufficient')),
  coverage_ratio numeric(6,5) not null check (coverage_ratio between 0 and 1),
  scoring_algorithm_version text not null,
  summary jsonb not null,
  insights jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_type, period_start),
  constraint period_reviews_range_check check (period_end >= period_start)
);

create index user_goals_user_effective_idx on public.user_goals (user_id, effective_from desc);
create index body_measurements_user_measured_idx on public.body_measurements (user_id, measured_at desc);
create index meal_logs_user_eaten_idx on public.meal_logs (user_id, eaten_at desc);
create index meal_items_meal_log_idx on public.meal_items (meal_log_id);
create index meal_items_user_idx on public.meal_items (user_id);
create index custom_foods_user_name_idx on public.custom_foods (user_id, name);
create index custom_foods_user_favorite_idx on public.custom_foods (user_id, is_favorite) where is_favorite;
create index saved_meals_user_recent_idx on public.saved_meals (user_id, last_used_at desc nulls last);
create index saved_meals_user_favorite_idx on public.saved_meals (user_id, is_favorite) where is_favorite;
create index hydration_logs_user_consumed_idx on public.hydration_logs (user_id, consumed_at desc);
create index activity_logs_user_occurred_idx on public.activity_logs (user_id, occurred_at desc);
create index day_status_user_date_idx on public.day_status (user_id, local_date desc);
create index daily_reviews_user_date_idx on public.daily_reviews (user_id, local_date desc);
create index period_reviews_user_period_idx on public.period_reviews (user_id, period_type, period_start desc);

alter table public.profiles enable row level security;
alter table public.user_goals enable row level security;
alter table public.body_measurements enable row level security;
alter table public.meal_logs enable row level security;
alter table public.meal_items enable row level security;
alter table public.custom_foods enable row level security;
alter table public.saved_meals enable row level security;
alter table public.hydration_logs enable row level security;
alter table public.activity_logs enable row level security;
alter table public.day_status enable row level security;
alter table public.daily_reviews enable row level security;
alter table public.period_reviews enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete_own on public.profiles for delete to authenticated using ((select auth.uid()) = id);

create policy user_goals_select_own on public.user_goals for select to authenticated using ((select auth.uid()) = user_id);
create policy user_goals_insert_own on public.user_goals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy user_goals_update_own on public.user_goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy user_goals_delete_own on public.user_goals for delete to authenticated using ((select auth.uid()) = user_id);

create policy body_measurements_select_own on public.body_measurements for select to authenticated using ((select auth.uid()) = user_id);
create policy body_measurements_insert_own on public.body_measurements for insert to authenticated with check ((select auth.uid()) = user_id);
create policy body_measurements_update_own on public.body_measurements for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy body_measurements_delete_own on public.body_measurements for delete to authenticated using ((select auth.uid()) = user_id);

create policy meal_logs_select_own on public.meal_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy meal_logs_insert_own on public.meal_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy meal_logs_update_own on public.meal_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy meal_logs_delete_own on public.meal_logs for delete to authenticated using ((select auth.uid()) = user_id);

create policy meal_items_select_own on public.meal_items for select to authenticated using ((select auth.uid()) = user_id);
create policy meal_items_insert_own on public.meal_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy meal_items_update_own on public.meal_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy meal_items_delete_own on public.meal_items for delete to authenticated using ((select auth.uid()) = user_id);

create policy custom_foods_select_own on public.custom_foods for select to authenticated using ((select auth.uid()) = user_id);
create policy custom_foods_insert_own on public.custom_foods for insert to authenticated with check ((select auth.uid()) = user_id);
create policy custom_foods_update_own on public.custom_foods for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy custom_foods_delete_own on public.custom_foods for delete to authenticated using ((select auth.uid()) = user_id);

create policy saved_meals_select_own on public.saved_meals for select to authenticated using ((select auth.uid()) = user_id);
create policy saved_meals_insert_own on public.saved_meals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy saved_meals_update_own on public.saved_meals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy saved_meals_delete_own on public.saved_meals for delete to authenticated using ((select auth.uid()) = user_id);

create policy hydration_logs_select_own on public.hydration_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy hydration_logs_insert_own on public.hydration_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy hydration_logs_update_own on public.hydration_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy hydration_logs_delete_own on public.hydration_logs for delete to authenticated using ((select auth.uid()) = user_id);

create policy activity_logs_select_own on public.activity_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy activity_logs_insert_own on public.activity_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy activity_logs_update_own on public.activity_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy activity_logs_delete_own on public.activity_logs for delete to authenticated using ((select auth.uid()) = user_id);

create policy day_status_select_own on public.day_status for select to authenticated using ((select auth.uid()) = user_id);
create policy day_status_insert_own on public.day_status for insert to authenticated with check ((select auth.uid()) = user_id);
create policy day_status_update_own on public.day_status for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy day_status_delete_own on public.day_status for delete to authenticated using ((select auth.uid()) = user_id);

create policy daily_reviews_select_own on public.daily_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy daily_reviews_insert_own on public.daily_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy daily_reviews_update_own on public.daily_reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy daily_reviews_delete_own on public.daily_reviews for delete to authenticated using ((select auth.uid()) = user_id);

create policy period_reviews_select_own on public.period_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy period_reviews_insert_own on public.period_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy period_reviews_update_own on public.period_reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy period_reviews_delete_own on public.period_reviews for delete to authenticated using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.user_goals, public.body_measurements,
  public.meal_logs, public.meal_items, public.custom_foods, public.saved_meals,
  public.hydration_logs, public.activity_logs, public.day_status, public.daily_reviews,
  public.period_reviews to authenticated;

revoke all on public.profiles, public.user_goals, public.body_measurements,
  public.meal_logs, public.meal_items, public.custom_foods, public.saved_meals,
  public.hydration_logs, public.activity_logs, public.day_status, public.daily_reviews,
  public.period_reviews from anon;

create or replace function public.replace_active_goal(
  p_effective_from date,
  p_primary_goal text,
  p_calorie_target numeric,
  p_protein_target_g numeric,
  p_carbs_target_g numeric,
  p_fat_target_g numeric,
  p_fiber_target_g numeric,
  p_sodium_limit_mg numeric,
  p_added_sugar_limit_g numeric,
  p_water_target_ml integer,
  p_step_target integer,
  p_weekly_workout_target integer,
  p_late_meal_time time
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_existing_id uuid;
  v_existing_start date;
  v_goal_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select id, effective_from into v_existing_id, v_existing_start
  from public.user_goals
  where user_id = v_user_id
    and effective_from <= p_effective_from
    and (effective_until is null or effective_until > p_effective_from)
  order by effective_from desc
  limit 1;

  if v_existing_id is not null and v_existing_start = p_effective_from then
    update public.user_goals set
      primary_goal = p_primary_goal,
      calorie_target = p_calorie_target,
      protein_target_g = p_protein_target_g,
      carbs_target_g = p_carbs_target_g,
      fat_target_g = p_fat_target_g,
      fiber_target_g = p_fiber_target_g,
      sodium_limit_mg = p_sodium_limit_mg,
      added_sugar_limit_g = p_added_sugar_limit_g,
      water_target_ml = p_water_target_ml,
      step_target = p_step_target,
      weekly_workout_target = p_weekly_workout_target,
      late_meal_time = p_late_meal_time
    where id = v_existing_id
    returning id into v_goal_id;
  else
    update public.user_goals
    set effective_until = p_effective_from
    where user_id = v_user_id
      and effective_from < p_effective_from
      and (effective_until is null or effective_until > p_effective_from);

    insert into public.user_goals (
      user_id, effective_from, primary_goal, calorie_target, protein_target_g,
      carbs_target_g, fat_target_g, fiber_target_g, sodium_limit_mg,
      added_sugar_limit_g, water_target_ml, step_target, weekly_workout_target,
      late_meal_time
    ) values (
      v_user_id, p_effective_from, p_primary_goal, p_calorie_target, p_protein_target_g,
      p_carbs_target_g, p_fat_target_g, p_fiber_target_g, p_sodium_limit_mg,
      p_added_sugar_limit_g, p_water_target_ml, p_step_target, p_weekly_workout_target,
      p_late_meal_time
    ) returning id into v_goal_id;
  end if;

  return v_goal_id;
end;
$$;

revoke all on function public.replace_active_goal(date, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, integer, integer, integer, time) from public, anon;
grant execute on function public.replace_active_goal(date, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, integer, integer, integer, time) to authenticated;

commit;
