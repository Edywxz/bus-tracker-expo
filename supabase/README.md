# Back-end (Supabase)

## Configurar do zero
1. Crie um projeto em supabase.com e copie **URL** e **anon key** (Settings → API) para o `.env`
   (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`). Veja `.env.example`.
2. No **SQL Editor**, rode nesta ordem:
   1. `supabase/schema.sql` (tabelas base)
   2. `supabase/migrations/20261101000000_backend_completo.sql` (cadastro automático de perfil, notificações,
      chat, calendário, RPCs, gatilhos e políticas RLS)
3. **Authentication → Providers → Email**: para testar rápido, desative “Confirm email”.
   Com a confirmação ligada o app mostra a tela “Confirme seu e-mail”.
4. (Opcional) Agende a marcação de mensalidades vencidas, todo dia:
   ```sql
   select cron.schedule('mensalidades-vencidas', '0 6 * * *', $$select public.atualizar_mensalidades_vencidas()$$);
   ```

## Como funciona
| Fluxo | Onde |
|---|---|
| Cadastro → perfil e papel (Responsável / Transportador) | gatilho `handle_new_user` lê o metadata do `signUp` |
| Vínculo pai ↔ motorista | código de convite (`transportadores.codigo_convite`) |
| Escola do aluno | campos `alunos.escola_nome` / `escola_endereco` (a escola não é usuária) |
| Calendário (dias sem transporte) | `calendario_escolar`, escrito só pelo transportador, lido pelos pais vinculados |
| Cadastrar aluno + contrato + mensalidades do ano | RPC `cadastrar_aluno` |
| Pagamento | pai informa (`registrar_pagamento`, fica PENDENTE) → motorista confirma (`confirmar_recebimento`) |
| Avisos (embarque, rota, ocorrência, falta, pagamento) | gatilhos criam linhas em `notificacoes` |
| Chat | tabela `mensagens`, um canal por transportador |
| Tempo real | publicação `supabase_realtime` + broadcast `viagem:{id}` para a posição da van |

## Segurança (RLS)
Todas as tabelas têm RLS. Pontos de atenção:
- Pais **não** conseguem marcar mensalidade como paga direto: só pela RPC e com confirmação do motorista.
- Alunos só são criados pela RPC; ela valida o código do transportador.
- A anon key é pública por design; nunca coloque a `service_role` no app.

## Ainda não coberto
- **GPS real do motorista:** o app recebe e exibe a posição, mas quem envia precisa de `expo-location`
  (`npx expo install expo-location`) chamando `LocationTrackerService.enviarLocalizacao`.
- **Cobrança automática (PSP):** hoje o pagamento é confirmado manualmente pelo motorista.
- **Push notifications** com o app fechado (`expo-notifications`).
- **Tipos TypeScript:** `src/types/supabase.ts` foi gerado do banco em 06/11/2026. Se mudar o schema, gere de novo com
  `npx supabase gen types typescript --project-id <id> > src/types/supabase.ts`.
