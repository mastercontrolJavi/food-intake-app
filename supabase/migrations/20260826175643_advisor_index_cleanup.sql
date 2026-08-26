create index daily_reviews_goal_id_idx
  on public.daily_reviews (goal_id)
  where goal_id is not null;

drop index if exists public.custom_foods_user_favorite_idx;
drop index if exists public.saved_meals_user_favorite_idx;
