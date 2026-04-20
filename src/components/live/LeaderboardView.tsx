"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { buildDiceBearAvatarUrl } from "@/lib/live/avatar";
import { getUnlockItem } from "@/lib/live/catalog";
import { getLiveAvatarAuraClass, getLiveFontClass, getLiveFrameClass } from "@/lib/live/cosmetics";

interface Row {
  id: string;
  nickname: string;
  avatar_seed: string;
  active_avatar: string;
  active_title: string;
  active_frame: string;
  active_font: string;
  total_points: number;
}

export function LeaderboardView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/live/leaderboard", { cache: "no-store" });
    const payload = await res.json();
    if (res.ok) {
      setRows(payload.rows ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadLeaderboard();
    const id = setInterval(() => {
      void loadLeaderboard();
    }, 10000);
    return () => clearInterval(id);
  }, [loadLeaderboard]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Ładowanie leaderboardu...</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.id} className="flex items-center gap-3 border border-border p-3">
          <p className="w-8 text-center font-mono text-sm">#{index + 1}</p>
          <div className={`live-avatar-frame ${getLiveFrameClass(row.active_frame)}`}>
            <Image
              src={buildDiceBearAvatarUrl(row.avatar_seed, row.active_avatar)}
              alt={`Avatar ${row.nickname}`}
              width={40}
              height={40}
              className={`h-10 w-10 rounded-full ${getLiveAvatarAuraClass(row.active_avatar)}`}
              unoptimized
            />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${getLiveFontClass(row.active_font)}`}>
              {row.nickname}
            </p>
            <p className="text-xs text-muted-foreground">
              {getUnlockItem(row.active_title)?.name ?? row.active_title}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-black tabular-nums">{row.total_points}</p>
            <p className="font-mono text-[11px] text-muted-foreground">ranking</p>
          </div>
        </div>
      ))}
    </div>
  );
}
