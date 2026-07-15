import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import type { GamePlatform, GameStatus } from "../../lib/games-store";

const STATUS_VARIANT: Record<GameStatus, "default" | "warning" | "success"> = {
  "Em desenvolvimento": "default",
  "Em revisão": "warning",
  Publicado: "success",
};

export function GameCard({
  name,
  description,
  status,
  platforms,
  updatedAt,
}: {
  name: string;
  description: string;
  status: GameStatus;
  platforms: GamePlatform[];
  updatedAt?: string;
}) {
  return (
    <Card className="transition-transform hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-center justify-between gap-sm">
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-sm">
        <div className="flex flex-wrap gap-sm">
          {platforms.map((platform) => (
            <Badge key={platform} variant="outline">
              {platform}
            </Badge>
          ))}
        </div>
        {updatedAt ? <span className="text-xs text-text-tertiary">Atualizado {updatedAt}</span> : null}
      </CardContent>
    </Card>
  );
}
