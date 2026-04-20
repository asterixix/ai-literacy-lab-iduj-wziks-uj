import { sql } from "./client";

export interface LeaderboardRow {
  id: string;
  nickname: string;
  avatar_seed: string;
  active_avatar: string;
  active_title: string;
  active_frame: string;
  active_theme: string;
  active_font: string;
  total_points: number;
  unlocked_count: number;
  spent_points: number;
}

export async function getWorkshopLeaderboard(workshopId: string): Promise<LeaderboardRow[]> {
  return (await sql`
    SELECT
      p.id,
      p.nickname,
      p.avatar_seed,
      p.active_avatar,
      p.active_title,
      p.active_frame,
      p.active_theme,
      p.active_font,
      p.total_points,
      COALESCE(ui.unlocked_count, 0) AS unlocked_count,
      COALESCE(sp.spent_points, 0) AS spent_points
    FROM participants p
    LEFT JOIN (
      SELECT participant_id, COUNT(*)::INTEGER AS unlocked_count
      FROM unlocked_items
      GROUP BY participant_id
    ) ui ON ui.participant_id = p.id
    LEFT JOIN (
      SELECT
        participant_id,
        COALESCE(SUM((metadata->>'pointsSpent')::INTEGER), 0)::INTEGER AS spent_points
      FROM point_transactions
      WHERE reason_code = 'store_purchase'
      GROUP BY participant_id
    ) sp ON sp.participant_id = p.id
    WHERE p.workshop_id = ${workshopId}
    ORDER BY p.total_points DESC, p.created_at ASC
    LIMIT 200
  `) as LeaderboardRow[];
}
