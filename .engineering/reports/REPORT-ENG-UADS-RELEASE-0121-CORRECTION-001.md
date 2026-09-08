# Engineering Report - `ENG-UADS-RELEASE-0121-CORRECTION-001`

Report type: `EVIDENCE`
Status: `COMPLETE`

## Scope and method

Este relatório registra a correção delimitada do caminho de título da
publicação UADS `0.12.0`. Ele cobre o baseline bloqueado, a causa exata no
publisher, a metadata do patch `0.12.1`, a cobertura de regressão, a
verificação local e hospedada e o estado parcial imutável de `v0.12.0`.

## Findings

- A tag existente `v0.12.0` continua anotada e aponta para o commit final
  auditado.
- O GitHub Release `v0.12.0` continua ausente.
- A correção fornece a seção validada do changelog à derivação genérica de
  títulos e adiciona regressões fail-closed.
- Nenhuma mutação de runtime, dependência, release histórico ou tag foi feita.
- O PR #22 está aberto no head `3ef2b051f57fe4563fa26cf9892170c82eb3c520`.
- O Foundation hospedado `34220628606` aprovou 49 arquivos, 409 testes,
  HEB01-HEB52, todas as evals e `finalVerdict: PASS`.
- CodeQL, Dependency Review e compatibilidade Linux/Windows Node 20 passaram.

## Risks and limitations

- `0.12.1` não é um release e não deve ser publicado por este Work Order.
- A suíte completa local do Windows não concluiu no limite operacional, sem
  emitir falha; a validação equivalente hospedada no Node 20 passou.
- A revisão independente e o merge protegido do maintainer continuam
  obrigatórios.

## Next action

O PR #22 deve permanecer aberto para auditoria independente. O executor deve
parar sem merge, sem criar tags e sem publicar o `0.12.1`.
