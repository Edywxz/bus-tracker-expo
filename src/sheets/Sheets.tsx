import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/tokens';
import { type } from '../theme/type';
import { Button, Card, Chip, Icon, Notice, SegmentedControl, Sheet, TextEditor, TextField } from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { useAction } from './useAction';
import {
  dateToISO, isoToBR, maskCpf, maskDate, maskPhone, maskPlaca, onlyDigits, parseMoney,
} from '../utils/format';
import { PeriodoAusencia, SeveridadeEvento } from '../types/database';

const TURNOS = [
  { v: 'MANHA', l: 'Manhã' }, { v: 'TARDE', l: 'Tarde' }, { v: 'INTEGRAL', l: 'Integral' }, { v: 'NOITE', l: 'Noite' },
] as const;

const Row2: React.FC<{ children: React.ReactNode }> = ({ children }) => <View style={st.wrap}>{children}</View>;
const Label: React.FC<{ children: string }> = ({ children }) => <Text style={st.label}>{children}</Text>;

interface BaseProps { visible: boolean; onClose: () => void }

/* ------------------------------------------------------------ Falta */
export const AbsenceSheet: React.FC<BaseProps & { alunoId?: string }> = ({ visible, onClose, alunoId }) => {
  const { alunos, comunicarAusencia } = useApp();
  const { run, loading, error, setError } = useAction();
  const [sel, setSel] = useState(alunoId ?? alunos[0]?.id ?? '');
  const [periodo, setPeriodo] = useState<PeriodoAusencia>('AMBOS');
  const [motivo, setMotivo] = useState('');
  useEffect(() => { if (visible) { setSel(alunoId ?? alunos[0]?.id ?? ''); setMotivo(''); setError(null); } }, [visible]); // eslint-disable-line

  const enviar = async () => {
    if (await run(() => comunicarAusencia(sel, periodo, motivo.trim()))) onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Avisar falta" subtitle="O motorista é avisado na hora e o dependente sai da lista de hoje."
      footer={<Button size="lg" label="Enviar aviso" onPress={enviar} loading={loading} disabled={!sel} />}>
      {alunos.length > 1 && (<><Label>Dependente</Label><Row2>{alunos.map((a) => <Chip key={a.id} label={a.nome.split(' ')[0]} selected={sel === a.id} onPress={() => setSel(a.id)} />)}</Row2></>)}
      <Label>Qual trajeto?</Label>
      <SegmentedControl value={periodo} onChange={setPeriodo}
        options={[{ value: 'IDA', label: 'Ida' }, { value: 'VOLTA', label: 'Volta' }, { value: 'AMBOS', label: 'Ida e volta' }]} />
      <TextEditor label="Motivo (opcional)" value={motivo} onChangeText={setMotivo} placeholder="Ex.: consulta médica" />
      {error && <Notice tone="error" message={error} />}
    </Sheet>
  );
};

/* ------------------------------------------------------------ Ocorrência */
const TIPOS_EVENTO = ['Trânsito intenso', 'Pane mecânica', 'Desvio de via', 'Acidente na pista', 'Emergência médica'];
export const EmergencySheet: React.FC<BaseProps> = ({ visible, onClose }) => {
  const { registrarEventoRota } = useApp();
  const { run, loading, error, setError } = useAction();
  const [tipo, setTipo] = useState(TIPOS_EVENTO[0]);
  const [sev, setSev] = useState<SeveridadeEvento>('MEDIA');
  const [desc, setDesc] = useState('');
  const [erroCampo, setErroCampo] = useState<string | null>(null);
  useEffect(() => { if (visible) { setDesc(''); setError(null); setErroCampo(null); } }, [visible]); // eslint-disable-line

  const enviar = async () => {
    if (desc.trim().length < 3) return setErroCampo('Descreva rapidamente o que aconteceu.');
    if (await run(() => registrarEventoRota(tipo, desc.trim(), sev))) onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Avisar ocorrência" subtitle="Os responsáveis da rota recebem o alerta agora."
      footer={<Button size="lg" role="destructive" label="Disparar alerta" onPress={enviar} loading={loading} />}>
      <Label>O que aconteceu?</Label>
      <Row2>{TIPOS_EVENTO.map((t) => <Chip key={t} label={t} selected={tipo === t} onPress={() => setTipo(t)} />)}</Row2>
      <Label>Gravidade</Label>
      <SegmentedControl value={sev} onChange={setSev}
        options={[{ value: 'BAIXA', label: 'Baixa' }, { value: 'MEDIA', label: 'Média' }, { value: 'ALTA', label: 'Alta' }, { value: 'EMERGENCIA', label: 'Urgente' }]} />
      <TextField label="Descrição" value={desc} onChangeText={(v) => { setDesc(v); setErroCampo(null); }} error={erroCampo} placeholder="Ex.: acidente na Av. Brasil, atraso de 15 min" multiline />
      {error && <Notice tone="error" message={error} />}
    </Sheet>
  );
};

/* ------------------------------------------------------------ Iniciar rota */
export const StartRouteSheet: React.FC<BaseProps> = ({ visible, onClose }) => {
  const { iniciarViagem, veiculo } = useApp();
  const { run, loading, error, setError } = useAction();
  const [tipo, setTipo] = useState<'IDA' | 'VOLTA'>('IDA');
  const [turno, setTurno] = useState<'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE'>('MANHA');
  useEffect(() => { if (visible) setError(null); }, [visible]); // eslint-disable-line
  return (
    <Sheet visible={visible} onClose={onClose} title="Iniciar rota" subtitle="Os responsáveis são avisados e passam a ver a van."
      footer={<Button size="lg" label="Iniciar agora" icon="play"
        onPress={async () => { if (await run(() => iniciarViagem(tipo, turno))) onClose(); }} loading={loading} />}>
      <SegmentedControl value={tipo} onChange={setTipo} options={[{ value: 'IDA', label: 'Ida à escola' }, { value: 'VOLTA', label: 'Volta para casa' }]} />
      <Label>Turno</Label>
      <Row2>{TURNOS.map((t) => <Chip key={t.v} label={t.l} selected={turno === t.v} onPress={() => setTurno(t.v)} />)}</Row2>
      {veiculo.placa ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="van" size={22} color={colors.secondaryLabel} />
          <View><Text style={st.strong}>{veiculo.modelo}</Text><Text style={st.muted}>Placa {veiculo.placa}</Text></View>
        </Card>
      ) : null}
      {error && <Notice tone="error" message={error} />}
    </Sheet>
  );
};

/* ------------------------------------------------------------ Novo aluno */
export const AddStudentSheet: React.FC<BaseProps> = ({ visible, onClose }) => {
  const { buscarTransportador, cadastrarAluno } = useApp();
  const { run, loading, error, setError } = useAction();
  const [passo, setPasso] = useState<1 | 2>(1);
  const [codigo, setCodigo] = useState('');
  const [transp, setTransp] = useState<{ id: string; nome: string } | null>(null);
  const [f, setF] = useState({ nome: '', nasc: '', turma: '', turno: 'MANHA' as 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE', busca: '', local: '', entrega: '', obs: '', escola: '' });
  const [erros, setErros] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (visible) { setPasso(1); setCodigo(''); setTransp(null); setError(null); setErros({}); setF({ nome: '', nasc: '', turma: '', turno: 'MANHA', busca: '', local: '', entrega: '', obs: '', escola: '' }); }
  }, [visible]); // eslint-disable-line

  const verificar = () => run(async () => {
    if (codigo.trim().length < 4) throw new Error('Digite o código que o motorista passou para você.');
    const t = await buscarTransportador(codigo);
    if (!t) throw new Error('Não encontramos esse código. Confira com o motorista.');
    setTransp(t);
  });

  const salvar = async () => {
    const e: Record<string, string> = {};
    if (f.nome.trim().length < 2) e.nome = 'Informe o nome do dependente.';
    const iso = dateToISO(f.nasc);
    if (!iso) e.nasc = 'Use o formato DD/MM/AAAA.';
    if (!f.turma.trim()) e.turma = 'Informe a turma.';
    if (f.busca.trim().length < 5) e.busca = 'Informe o endereço de embarque.';
    if (f.local.trim().length < 3) e.local = 'Informe bairro e cidade, ou o CEP.';
    if (f.escola.trim().length < 2) e.escola = 'Informe a escola do dependente.';
    if (f.entrega.trim().length < 3) e.entrega = 'Informe o destino.';
    setErros(e);
    if (Object.keys(e).length) return;
    if (await run(() => cadastrarAluno({
      nome: f.nome.trim(), dataNascimento: iso!, turma: f.turma.trim(), turno: f.turno,
      enderecoBusca: `${f.busca.trim()}, ${f.local.trim()}`, enderecoEntrega: f.entrega.trim(), observacoes: f.obs.trim(),
      codigoTransportador: codigo, escolaNome: f.escola.trim() || undefined, escolaEndereco: f.entrega.trim(),
    }))) onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={passo === 1 ? 'Vincular ao motorista' : 'Dados do dependente'}
      subtitle={passo === 1 ? 'Peça ao motorista o código dele (fica em Conta, no app dele).' : `Motorista: ${transp?.nome ?? ''}`}
     
      footer={passo === 1
        ? (transp
          ? <Button size="lg" label="Continuar" onPress={() => { setError(null); setPasso(2); }} />
          : <Button size="lg" label="Verificar código" onPress={verificar} loading={loading} />)
        : <Button size="lg" label="Cadastrar dependente" onPress={salvar} loading={loading} />}>
      {passo === 1 ? (
        <>
          <TextField label="Código do motorista" value={codigo} onChangeText={(v) => { setCodigo(v.toUpperCase()); setTransp(null); setError(null); }}
            autoCapitalize="characters" autoCorrect={false} placeholder="Ex.: A1B2C3" maxLength={8} icon="key"
            returnKeyType="done" onSubmitEditing={verificar} />
          {transp && (
            <Notice tone="success" message={`Motorista encontrado: ${transp.nome}.`} />
          )}
          {error && <Notice tone="error" message={error} />}
        </>
      ) : (
        <>
          <TextField label="Nome completo" value={f.nome} onChangeText={set('nome')} error={erros.nome} autoCapitalize="words" />
          <TextField label="Data de nascimento" value={f.nasc} onChangeText={(v) => set('nasc')(maskDate(v))} error={erros.nasc} keyboardType="number-pad" placeholder="DD/MM/AAAA" />
          <TextField label="Turma" value={f.turma} onChangeText={set('turma')} error={erros.turma} placeholder="Ex.: 5º Ano B" />
          <Label>Turno</Label>
          <Row2>{TURNOS.map((t) => <Chip key={t.v} label={t.l} selected={f.turno === t.v} onPress={() => setF((p) => ({ ...p, turno: t.v }))} />)}</Row2>
          <TextField label="Onde o dependente embarca" value={f.busca} onChangeText={set('busca')} error={erros.busca} icon="home" placeholder="Rua, número, complemento" helper="Usamos este endereço seu para localizar o ponto no mapa (powered by Geoapify)." />
          <TextField label="Bairro e cidade, ou CEP" value={f.local} onChangeText={set('local')} error={erros.local} icon="location" placeholder="Ex.: Bela Vista, São Paulo ou 01310-100" helper="Evita localizar uma rua de mesmo nome em outro bairro." />
          <TextField label="Escola" value={f.escola} onChangeText={set('escola')} error={erros.escola} icon="school" autoCapitalize="words" placeholder="Ex.: Colégio Santa Maria" />
          <TextField label="Onde desembarca" value={f.entrega} onChangeText={set('entrega')} error={erros.entrega} icon="location" placeholder="Rua, número, bairro, cidade (e portão)" />
          <TextField label="Observações de saúde (opcional)" value={f.obs} onChangeText={set('obs')} multiline helper="Alergias ou cuidados. Só você e o motorista veem." />
          {error && <Notice tone="error" message={error} />}
        </>
      )}
    </Sheet>
  );
};

/* ------------------------------------------------------------ Pessoa autorizada */
const PARENTESCOS = ['Mãe', 'Pai', 'Avó', 'Avô', 'Tio(a)', 'Outro'];
export const AuthorizedSheet: React.FC<BaseProps & { alunoId?: string }> = ({ visible, onClose, alunoId }) => {
  const { alunos, adicionarPessoaAutorizada } = useApp();
  const { run, loading, error, setError } = useAction();
  const [sel, setSel] = useState(alunoId ?? alunos[0]?.id ?? '');
  const [nome, setNome] = useState(''); const [cpf, setCpf] = useState(''); const [tel, setTel] = useState(''); const [par, setPar] = useState('Mãe');
  const [erros, setErros] = useState<Record<string, string>>({});
  useEffect(() => { if (visible) { setSel(alunoId ?? alunos[0]?.id ?? ''); setNome(''); setCpf(''); setTel(''); setPar('Mãe'); setErros({}); setError(null); } }, [visible]); // eslint-disable-line

  const salvar = async () => {
    const e: Record<string, string> = {};
    if (nome.trim().length < 2) e.nome = 'Informe o nome.';
    if (onlyDigits(cpf).length !== 11) e.cpf = 'CPF com 11 dígitos.';
    if (onlyDigits(tel).length < 10) e.tel = 'Telefone com DDD.';
    setErros(e);
    if (Object.keys(e).length || !sel) return;
    if (await run(() => adicionarPessoaAutorizada({ aluno_id: sel, nome: nome.trim(), cpf, telefone: tel, grau_parentesco: par }))) onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Pessoa autorizada" subtitle="Só quem está nesta lista pode buscar o dependente."
      footer={<Button size="lg" label="Adicionar" onPress={salvar} loading={loading} />}>
      {alunos.length > 1 && (<><Label>Dependente</Label><Row2>{alunos.map((a) => <Chip key={a.id} label={a.nome.split(' ')[0]} selected={sel === a.id} onPress={() => setSel(a.id)} />)}</Row2></>)}
      <TextField label="Nome completo" value={nome} onChangeText={setNome} error={erros.nome} autoCapitalize="words" />
      <TextField label="CPF" value={cpf} onChangeText={(v) => setCpf(maskCpf(v))} error={erros.cpf} keyboardType="number-pad" placeholder="000.000.000-00" />
      <TextField label="Telefone" value={tel} onChangeText={(v) => setTel(maskPhone(v))} error={erros.tel} keyboardType="phone-pad" placeholder="(11) 90000-0000" autoComplete="tel" />
      <Label>Parentesco</Label>
      <Row2>{PARENTESCOS.map((p) => <Chip key={p} label={p} selected={par === p} onPress={() => setPar(p)} />)}</Row2>
      {error && <Notice tone="error" message={error} />}
    </Sheet>
  );
};

/* ------------------------------------------------------------ Calendário (motorista) */
const TIPOS_DIA = [
  { value: 'FERIADO', label: 'Feriado' }, { value: 'RECESSO', label: 'Recesso' }, { value: 'EVENTO', label: 'Evento' },
] as const;
export const CalendarEventSheet: React.FC<BaseProps> = ({ visible, onClose }) => {
  const { adicionarEventoCalendario } = useApp();
  const { run, loading, error, setError } = useAction();
  const [data, setData] = useState(''); const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<'FERIADO' | 'RECESSO' | 'EVENTO'>('FERIADO');
  const [erros, setErros] = useState<Record<string, string>>({});
  useEffect(() => { if (visible) { setData(''); setTitulo(''); setTipo('FERIADO'); setErros({}); setError(null); } }, [visible]); // eslint-disable-line

  const salvar = async () => {
    const e: Record<string, string> = {};
    const iso = dateToISO(data);
    if (!iso) e.data = 'Use o formato DD/MM/AAAA.';
    if (titulo.trim().length < 2) e.titulo = 'Dê um nome para a data.';
    setErros(e);
    if (Object.keys(e).length) return;
    if (await run(() => adicionarEventoCalendario({ data: iso!, titulo: titulo.trim(), tipo }))) onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Marcar data" subtitle="Os responsáveis veem no calendário que a van não roda."
      footer={<Button size="lg" label="Adicionar" onPress={salvar} loading={loading} />}>
      <TextField label="Data" value={data} onChangeText={(v) => setData(maskDate(v))} error={erros.data} keyboardType="number-pad" placeholder="DD/MM/AAAA" />
      <TextField label="Descrição" value={titulo} onChangeText={setTitulo} error={erros.titulo} placeholder="Ex.: Recesso escolar" />
      <Label>Tipo</Label>
      <SegmentedControl value={tipo} onChange={setTipo} options={[...TIPOS_DIA]} />
      {error && <Notice tone="error" message={error} />}
    </Sheet>
  );
};

/* ------------------------------------------------------------ Veículo */
export const VehicleSheet: React.FC<BaseProps> = ({ visible, onClose }) => {
  const { veiculo, atualizarVeiculo } = useApp();
  const { run, loading, error, setError } = useAction();
  const [f, setF] = useState({ placa: '', modelo: '', ano: '', cap: '', renavam: '', alvara: '', vist: '' });
  const [erros, setErros] = useState<Record<string, string>>({});
  useEffect(() => {
    if (visible) {
      setF({ placa: veiculo.placa, modelo: veiculo.modelo, ano: veiculo.ano ? String(veiculo.ano) : '', cap: veiculo.capacidade_assentos ? String(veiculo.capacidade_assentos) : '',
        renavam: veiculo.renavam, alvara: veiculo.numero_alvara, vist: isoToBR(veiculo.validade_vistoria) });
      setErros({}); setError(null);
    }
  }, [visible]); // eslint-disable-line
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const salvar = async () => {
    const e: Record<string, string> = {};
    if (f.placa.length < 7) e.placa = 'Placa com 7 caracteres.';
    if (f.modelo.trim().length < 2) e.modelo = 'Informe o modelo.';
    const ano = Number(f.ano); if (!(ano >= 1990 && ano <= new Date().getFullYear() + 1)) e.ano = 'Ano inválido.';
    const cap = Number(f.cap); if (!(cap >= 1 && cap <= 60)) e.cap = 'Informe os assentos.';
    if (onlyDigits(f.renavam).length < 9) e.renavam = 'RENAVAM inválido.';
    if (!f.alvara.trim()) e.alvara = 'Informe o alvará.';
    const vist = dateToISO(f.vist); if (!vist) e.vist = 'Use DD/MM/AAAA.';
    setErros(e);
    if (Object.keys(e).length) return;
    if (await run(() => atualizarVeiculo({ placa: f.placa, modelo: f.modelo.trim(), ano, capacidade_assentos: cap, renavam: f.renavam, numero_alvara: f.alvara.trim(), validade_vistoria: vist! }))) onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title={veiculo.placa ? 'Editar veículo' : 'Cadastrar veículo'}
      footer={<Button size="lg" label="Salvar" onPress={salvar} loading={loading} />}>
      <TextField label="Placa" value={f.placa} onChangeText={(v) => set('placa')(maskPlaca(v))} error={erros.placa} autoCapitalize="characters" placeholder="ABC1D23" />
      <TextField label="Modelo" value={f.modelo} onChangeText={set('modelo')} error={erros.modelo} placeholder="Ex.: Mercedes Sprinter" />
      <Row2>
        <View style={{ flex: 1, minWidth: 140 }}><TextField label="Ano" value={f.ano} onChangeText={set('ano')} error={erros.ano} keyboardType="number-pad" maxLength={4} /></View>
        <View style={{ flex: 1, minWidth: 140 }}><TextField label="Assentos" value={f.cap} onChangeText={set('cap')} error={erros.cap} keyboardType="number-pad" maxLength={2} /></View>
      </Row2>
      <TextField label="RENAVAM" value={f.renavam} onChangeText={(v) => set('renavam')(onlyDigits(v).slice(0, 11))} error={erros.renavam} keyboardType="number-pad" />
      <TextField label="Nº do alvará" value={f.alvara} onChangeText={set('alvara')} error={erros.alvara} />
      <TextField label="Validade da vistoria" value={f.vist} onChangeText={(v) => set('vist')(maskDate(v))} error={erros.vist} keyboardType="number-pad" placeholder="DD/MM/AAAA" />
      {error && <Notice tone="error" message={error} />}
    </Sheet>
  );
};

/* ------------------------------------------------------------ Perfil */
export const EditProfileSheet: React.FC<BaseProps> = ({ visible, onClose }) => {
  const { perfil, atualizarPerfil } = useApp();
  const { run, loading, error, setError } = useAction();
  const [nome, setNome] = useState('');
  const [tel, setTel] = useState('');
  useEffect(() => { if (visible) { setNome(perfil?.nome ?? ''); setTel(''); setError(null); } }, [visible]); // eslint-disable-line
  return (
    <Sheet visible={visible} onClose={onClose} title="Editar perfil"
      footer={<Button size="lg" label="Salvar" loading={loading} onPress={async () => {
        if (nome.trim().length < 2) return setError('Informe seu nome.');
        const d: { nome?: string; telefone?: string } = { nome: nome.trim() };
        if (tel) d.telefone = tel;
        if (await run(() => atualizarPerfil(d))) onClose();
      }} />}>
      <TextField label="Nome" value={nome} onChangeText={setNome} autoCapitalize="words" autoComplete="name" />
      <TextField label="Telefone (opcional)" value={tel} onChangeText={(v) => setTel(maskPhone(v))} keyboardType="phone-pad" placeholder="(11) 90000-0000" autoComplete="tel" />
      <Text style={st.muted}>O e-mail é o seu acesso e não pode ser alterado aqui.</Text>
      {error && <Notice tone="error" message={error} />}
    </Sheet>
  );
};

/* ------------------------------------------------------------ Recebimento */
export const ReceiptSettingsSheet: React.FC<BaseProps> = ({ visible, onClose }) => {
  const { recebimento, salvarConfigRecebimento } = useApp();
  const { run, loading, error, setError } = useAction();
  const [valor, setValor] = useState(''); const [dia, setDia] = useState('10'); const [pix, setPix] = useState('');
  useEffect(() => {
    if (visible) { setValor(recebimento.valor ? String(recebimento.valor).replace('.', ',') : ''); setDia(String(recebimento.diaVencimento ?? 10)); setPix(recebimento.chavePix ?? ''); setError(null); }
  }, [visible]); // eslint-disable-line
  return (
    <Sheet visible={visible} onClose={onClose} title="Recebimento" subtitle="Vale para novos passageiros vinculados a você."
      footer={<Button size="lg" label="Salvar" loading={loading} onPress={async () => {
        const v = parseMoney(valor); const d = Number(dia);
        if (!v) return setError('Informe o valor da mensalidade.');
        if (!(d >= 1 && d <= 28)) return setError('O vencimento deve ser entre os dias 1 e 28.');
        if (await run(() => salvarConfigRecebimento({ valor: v, dia: d, chavePix: pix }))) onClose();
      }} />}>
      <TextField label="Valor da mensalidade (R$)" value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="350,00" />
      <TextField label="Dia de vencimento" value={dia} onChangeText={(v) => setDia(onlyDigits(v).slice(0, 2))} keyboardType="number-pad" helper="Entre 1 e 28" />
      <TextField label="Chave PIX" value={pix} onChangeText={setPix} autoCapitalize="none" autoCorrect={false} placeholder="E-mail, telefone, CPF ou chave aleatória" helper="É mostrada aos responsáveis na hora de pagar." />
      {error && <Notice tone="error" message={error} />}
    </Sheet>
  );
};

const st = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { ...type.footnote, color: colors.secondaryLabel, marginBottom: -8, paddingHorizontal: 4 },
  strong: { ...type.callout, fontWeight: '700', color: colors.label },
  muted: { ...type.footnote, color: colors.secondaryLabel },
});
