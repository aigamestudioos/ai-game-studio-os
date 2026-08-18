import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

// Sprint 2.16b — fake provider server determinístico para Google Play e
// Apple App Store Connect. Não é um framework: um servidor HTTP real
// (node:http) que os clients de `google-play/client.ts` e `apple/client.ts`
// conseguem chamar como se fosse a API oficial (via parâmetro `baseUrl`),
// gravando cada request recebida (para assertions byte/JSON-exatas) e
// permitindo scripts de resposta por teste (sucesso, 401/403/409/429/5xx,
// "resposta perdida" simulada fechando a conexão sem responder).
//
// Nunca persiste nada em disco — todo estado vive em memória e morre com o
// processo de teste.

export type RecordedRequest = {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
};

export type ScriptedResponse =
  | { kind: "json"; status: number; body: unknown }
  | { kind: "lost" } // aceita a conexão e nunca responde (simula resposta perdida) — cliente estoura timeout.
  | { kind: "reset" }; // derruba a conexão imediatamente (erro de rede cru).

export type RouteKey = string; // `${METHOD} ${pathname}` (sem query string)

export class FakeProviderServer {
  private server: Server;
  public readonly requests: RecordedRequest[] = [];
  private routes = new Map<RouteKey, ScriptedResponse[]>();
  private defaultResponse: ScriptedResponse = { kind: "json", status: 200, body: {} };

  constructor() {
    this.server = createServer((req, res) => this.handle(req, res));
  }

  async listen(): Promise<string> {
    await new Promise<void>((resolve) => this.server.listen(0, "127.0.0.1", resolve));
    const addr = this.server.address();
    if (!addr || typeof addr === "string") throw new Error("fake provider server: endereço inválido");
    return `http://127.0.0.1:${addr.port}`;
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => this.server.close((err) => (err ? reject(err) : resolve())));
  }

  reset(): void {
    this.requests.length = 0;
    this.routes.clear();
    this.defaultResponse = { kind: "json", status: 200, body: {} };
  }

  // Enfileira UMA resposta para o próximo request que casar com
  // `method path`. Chamadas subsequentes ao mesmo par usam a última
  // resposta enfileirada restante, ou o default se a fila esvaziar — assim
  // um teste consegue simular "primeira tentativa 500, segunda sucesso".
  queue(method: string, pathname: string, response: ScriptedResponse): void {
    const key = `${method.toUpperCase()} ${pathname}`;
    const list = this.routes.get(key) ?? [];
    list.push(response);
    this.routes.set(key, list);
  }

  setDefault(response: ScriptedResponse): void {
    this.defaultResponse = response;
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    let parsedBody: unknown = null;
    if (raw.length > 0) {
      try {
        parsedBody = JSON.parse(raw);
      } catch {
        parsedBody = raw;
      }
    }

    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    this.requests.push({
      method: req.method ?? "GET",
      url: req.url ?? "/",
      headers: { ...req.headers },
      body: parsedBody,
    });

    const key = `${(req.method ?? "GET").toUpperCase()} ${url.pathname}`;
    const queued = this.routes.get(key);
    const scripted = queued && queued.length > 0 ? queued.shift()! : this.defaultResponse;

    if (scripted.kind === "lost") {
      // Nunca escreve nada e nunca fecha — o client precisa estourar seu
      // próprio timeout (AbortController). Não destruímos o socket aqui
      // porque isso geraria ECONNRESET (cenário diferente, ver "reset").
      return;
    }
    if (scripted.kind === "reset") {
      req.socket.destroy();
      return;
    }
    const payload = JSON.stringify(scripted.body ?? {});
    res.writeHead(scripted.status, { "Content-Type": "application/json" });
    res.end(payload);
  }
}
