-- 1. Políticas para responsaveis
DO $$ BEGIN
    CREATE POLICY "Responsavel gerencia seu proprio perfil"
        ON public.responsaveis FOR ALL
        USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Transportador visualiza responsaveis dos seus alunos"
        ON public.responsaveis FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.alunos a
                WHERE a.responsavel_id = responsaveis.id
                AND a.transportador_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Políticas para transportadores
DO $$ BEGIN
    CREATE POLICY "Transportador gerencia seu proprio perfil"
        ON public.transportadores FOR ALL
        USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Responsaveis visualizam transportador contratado"
        ON public.transportadores FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.alunos a
                WHERE a.transportador_id = transportadores.id
                AND a.responsavel_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Políticas para instituicoes_ensino
DO $$ BEGIN
    CREATE POLICY "Instituicao gerencia seus dados"
        ON public.instituicoes_ensino FOR ALL
        USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Usuarios autenticados consultam escolas"
        ON public.instituicoes_ensino FOR SELECT
        TO authenticated
        USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Políticas para pessoas_autorizadas
DO $$ BEGIN
    CREATE POLICY "Responsavel gerencia pessoas autorizadas de seus alunos"
        ON public.pessoas_autorizadas FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.alunos a
                WHERE a.id = pessoas_autorizadas.aluno_id
                AND a.responsavel_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Transportador consulta pessoas autorizadas de seus alunos"
        ON public.pessoas_autorizadas FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.alunos a
                WHERE a.id = pessoas_autorizadas.aluno_id
                AND a.transportador_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. Políticas para comunicados_ausencia
DO $$ BEGIN
    CREATE POLICY "Responsavel gerencia comunicados de ausencia"
        ON public.comunicados_ausencia FOR ALL
        USING (auth.uid() = responsavel_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Transportador visualiza comunicados de seus alunos"
        ON public.comunicados_ausencia FOR SELECT
        USING (auth.uid() = transportador_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 6. Políticas para veiculos
DO $$ BEGIN
    CREATE POLICY "Transportador gerencia seus veiculos"
        ON public.veiculos FOR ALL
        USING (auth.uid() = transportador_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Pais visualizam veiculo ativo no transporte"
        ON public.veiculos FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.alunos a
                WHERE a.transportador_id = veiculos.transportador_id
                AND a.responsavel_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 7. Políticas para registros_embarque_desembarque
DO $$ BEGIN
    CREATE POLICY "Transportador registra e consulta embarques"
        ON public.registros_embarque_desembarque FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.viagens v
                WHERE v.id = registros_embarque_desembarque.viagem_id
                AND v.transportador_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Pais visualizam embarques de seus filhos"
        ON public.registros_embarque_desembarque FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.alunos a
                WHERE a.id = registros_embarque_desembarque.aluno_id
                AND a.responsavel_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 8. Políticas para eventos_rota
DO $$ BEGIN
    CREATE POLICY "Transportador gerencia eventos de sua rota"
        ON public.eventos_rota FOR ALL
        USING (auth.uid() = transportador_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Pais visualizam eventos da rota de seus filhos"
        ON public.eventos_rota FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.viagens v
                JOIN public.alunos a ON a.transportador_id = v.transportador_id
                WHERE v.id = eventos_rota.viagem_id
                AND a.responsavel_id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 9. Políticas para contratos_servico
DO $$ BEGIN
    CREATE POLICY "Partes envolvidas gerenciam contratos"
        ON public.contratos_servico FOR ALL
        USING (auth.uid() = transportador_id OR auth.uid() = responsavel_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 10. Políticas para pagamentos
DO $$ BEGIN
    CREATE POLICY "Acesso a pagamentos vinculados a mensalidades"
        ON public.pagamentos FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.mensalidades m
                WHERE m.id = pagamentos.mensalidade_id
                AND (m.responsavel_id = auth.uid() OR m.transportador_id = auth.uid())
            )
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Revogar execucao publica de funcoes definer se existirem
DO $$ BEGIN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
EXCEPTION WHEN undefined_function THEN null; END $$;
