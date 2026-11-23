-- Rankings are live by default: students always see the current leaderboard, no manual publish needed.
alter table leaderboard_settings alter column live set default true;
alter table leaderboard_settings alter column visible set default true;
update leaderboard_settings set live = true, visible = true where id = 1;
