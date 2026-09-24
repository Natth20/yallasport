-- Performance indexes for search/filter hot paths

CREATE INDEX IF NOT EXISTS "Match_homeTeamId_status_kickoffAt_idx" ON "Match"("homeTeamId", "status", "kickoffAt");
CREATE INDEX IF NOT EXISTS "Match_awayTeamId_status_kickoffAt_idx" ON "Match"("awayTeamId", "status", "kickoffAt");
CREATE INDEX IF NOT EXISTS "MatchEvent_playerId_type_idx" ON "MatchEvent"("playerId", "type");
CREATE INDEX IF NOT EXISTS "MatchEvent_type_idx" ON "MatchEvent"("type");
CREATE INDEX IF NOT EXISTS "PlayerTeam_teamId_to_idx" ON "PlayerTeam"("teamId", "to");
CREATE INDEX IF NOT EXISTS "PlayerTeam_playerId_idx" ON "PlayerTeam"("playerId");
CREATE INDEX IF NOT EXISTS "Standing_leagueId_seasonId_rank_idx" ON "Standing"("leagueId", "seasonId", "rank");
CREATE INDEX IF NOT EXISTS "News_category_status_publishedAt_idx" ON "News"("category", "status", "publishedAt");
CREATE INDEX IF NOT EXISTS "Comment_matchId_createdAt_idx" ON "Comment"("matchId", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_newsId_idx" ON "Comment"("newsId");
CREATE INDEX IF NOT EXISTS "Transfer_playerId_date_idx" ON "Transfer"("playerId", "date");
