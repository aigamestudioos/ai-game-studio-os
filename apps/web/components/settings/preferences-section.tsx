"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useTheme } from "../../hooks/use-theme";

export function PreferencesSection() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferências</CardTitle>
        <CardDescription>Sua escolha de tema é salva e aplicada automaticamente da próxima vez.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-sm">
          <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} size="sm">
            ☀︎ Claro
          </Button>
          <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} size="sm">
            ☾ Escuro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
