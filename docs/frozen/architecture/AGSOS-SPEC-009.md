# AGSOS-SPEC-009 — Quality, Testing & Delivery

**Versão:** 1.0.0 (inclui Revision 1)
**Status:** APPROVED FROZEN
**Classificação:** Documento Normativo

---

## 1. Pirâmide de Testes

70% Unitários → 20% Integração → 10% E2E

Proibido compensar ausência de unitários com E2E.

---

## 2. Ferramentas

| Tipo | Ferramenta |
|---|---|
| Unitários e Integração | Vitest |
| E2E | Playwright |
| Acessibilidade | axe-core |
| Performance | Lighthouse CI |
| Cobertura | V8 Coverage |
| Segurança (dependências) | npm audit |
| Segurança (dinâmica) | OWASP ZAP (pipeline noturna) |

---

## 3. Cobertura Progressiva

### Fase 1 (SPEC-004 a SPEC-006)
| Camada | Meta |
|---|---|
| Domain | ≥ 80% |
| Application | ≥ 70% |
| Infrastructure | ≥ 65% |
| UI | ≥ 60% |

### Fase 2 (SPEC-007 e SPEC-008)
| Camada | Meta |
|---|---|
| Domain | ≥ 90% |
| Application | ≥ 80% |
| Infrastructure | ≥ 75% |
| UI | ≥ 70% |

### Fase 3 (v1.0.0)
| Camada | Meta |
|---|---|
| Global | ≥ 85% |
| Domain | ≥ 90% |
| Application | ≥ 85% |
| Infrastructure | ≥ 80% |
| UI | ≥ 80% |

---

## 4. Estratégia E2E

| Contexto | Conjunto | Limite |
|---|---|---|
| Pull Request | Smoke Set (login, onboarding, criar projeto, executar IA) | < 3 min |
| Deploy Preview | Conjunto completo dos fluxos críticos | — |
| Noturno | Todos os cenários E2E | — |

---

## 5. Testes de Segurança

Obrigatórios: autenticação, autorização, RLS, CSRF, XSS, SQL Injection, validação de uploads, secrets.

---

## 6. Performance (Metas)

| Métrica | Meta |
|---|---|
| Primeira renderização | < 2s |
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| Bundle shell inicial | ≤ 450 KB gzip |

---

## 7. CI

Toda Pull Request executa: Type Check, ESLint, Prettier, Testes Unitários, Testes de Integração, Cobertura, Build, Testes E2E (Smoke Set). Nenhum merge se alguma etapa falhar.

---

## 8. CD

```
main → Build → Deploy Preview → Smoke Tests → Production
```

Deploy em produção somente após aprovação automática dos gates.

---

## 9. Git Flow (simplificado para solo founder)

```
main (sempre estável)
   ↑
feature/increment-X-Y  ← uma branch por incremento
```

**Sem branch develop.** PR direta para main. Tags semânticas por incremento.

### Branches
`main`, `feature/increment-X-Y`, `fix/nome`, `hotfix/nome`, `release/nome`

Toda branch referencia Issue ou Task.

### Commits (Conventional Commits)
```
feat(scope): description
fix(scope): description
refactor(scope): description
test(scope): description
docs(scope): description
chore(scope): description
ci(scope): description
```

---

## 10. Pull Requests

Todo PR contém: objetivo, contexto, alterações, testes executados, screenshots (quando UI), riscos conhecidos, checklist de DoD.

**Status de PR:**
- `READY FOR LOCAL VALIDATION` — sem pnpm install real
- `READY FOR MERGE` — CI verde + Preview OK
- `Completed` — após merge

Template: `.github/PULL_REQUEST_TEMPLATE.md`

---

## 11. Definition of Done

Funcionalidade completa quando:
- ✔ Código revisado
- ✔ Testes aprovados
- ✔ Cobertura atendida (fase correspondente)
- ✔ Documentação atualizada
- ✔ Telemetria implementada
- ✔ Acessibilidade validada (WCAG 2.2 AA)
- ✔ Performance dentro das metas
- ✔ Domain Events registrados
- ✔ Logs estruturados

---

## 12. Quality Gates (bloqueiam merge)

Build quebrado, testes falhando, cobertura abaixo da meta, lint, formatação, vulnerabilidades críticas.

---

## 13. Rollback

**Estratégia:** expand-and-contract (SPEC-003). Forward-only migrations. **Nunca criar `down.sql`**. Reversão por deploy de código compatível com schema anterior. Mudanças destrutivas exigem janela de compatibilidade.

---

## 14. Versionamento

Semantic Versioning: MAJOR.MINOR.PATCH.
Changelog: **Keep a Changelog** + Conventional Commits.
```
Added / Changed / Fixed / Deprecated / Removed / Security
```

---

## 15. Releases

Toda release: changelog, versão, data, autor, issues relacionadas, ADRs impactados.

**Fluxo release branch:**
```
develop → release/* → validação → merge em main + develop → tag semântica → remoção da branch
```
