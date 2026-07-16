import { createServerClient } from "@agsos/database";
import { NextResponse, type NextRequest } from "next/server";

// Rotas acessíveis sem sessão. Todo o restante é protegido — se uma rota nova
// de produto for criada, ela é protegida por padrão, sem precisar lembrar de
// adicionar nada aqui (allowlist, não denylist).
const PUBLIC_ROUTES = ["/", "/login", "/forgot-password", "/reset-password"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname);
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient({
    getAll: () => request.cookies.getAll(),
    set: (name, value, options) => {
      request.cookies.set(name, value);
      response.cookies.set(name, value, options);
    },
  });

  // getUser() (não getSession()) — valida o token contra o servidor do
  // Supabase em vez de só ler o cookie, evitando confiar em uma sessão
  // adulterada/expirada no meio do fluxo de proteção de rotas.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = isPublicRoute(pathname);

  if (!user && !isPublic) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/).*)"],
};
