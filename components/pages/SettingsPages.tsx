"use client";

import { useState } from "react";
import { PageHeader, MiniStat } from "./shared";
import {
  IconWallet,
  IconPix,
  IconBell,
  IconCheck,
  IconShield,
  IconCard,
} from "../icons";

/* ---------------------------------- Toggle --------------------------------- */

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative flex h-5 w-9 shrink-0 items-center rounded-full transition ${
        checked ? "bg-zen-red" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute h-4 w-4 rounded-full bg-white transition-all ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zen-border py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[12px] text-zen-muted">{desc}</p>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  mono,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20 ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}

function SaveButton({ label = "Salvar alterações" }: { label?: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
        saved
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-gradient-to-r from-zen-red to-zen-red-dark text-white shadow-red-soft hover:brightness-110"
      }`}
    >
      {saved ? <IconCheck className="h-4 w-4" /> : null}
      {saved ? "Salvo!" : label}
    </button>
  );
}

/* -------------------------------- Recebimento ------------------------------- */

export function ReceivingPage() {
  const [chavePix, setChavePix] = useState("");
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [titular, setTitular] = useState("");
  const [doc, setDoc] = useState("");
  const [auto, setAuto] = useState(true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recebimento"
        subtitle="Onde a ZenPay deposita o seu dinheiro e como funcionam suas taxas."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat
          icon={<IconWallet className="h-4 w-4" />}
          iconClass="bg-zen-red/15 text-zen-red-bright"
          label="Disponível para saque"
          value="R$ 0,00"
          highlight
        />
        <MiniStat
          icon={<IconPix className="h-4 w-4" />}
          iconClass="bg-amber-500/10 text-amber-400"
          label="A liberar"
          value="R$ 0,00"
          sub="D+1 para PIX"
        />
        <MiniStat
          icon={<IconCard className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="A liberar (cartão)"
          value="R$ 0,00"
          sub="D+30 para crédito"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <IconPix className="h-4 w-4" />
              </span>
              Chave PIX para saque
            </h2>
            <p className="mt-1 text-[12.5px] text-zen-muted">
              É para essa chave que os saques automáticos serão enviados.
            </p>
            <div className="mt-4 space-y-3">
              <Field
                label="Chave PIX"
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                value={chavePix}
                onChange={setChavePix}
              />
              <SettingRow
                title="Saque automático"
                desc="Envia o saldo disponível para sua chave PIX todo dia útil."
                checked={auto}
                onChange={setAuto}
              />
            </div>
            <div className="mt-4">
              <SaveButton />
            </div>
          </section>

          <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zen-red/15 text-zen-red-bright">
                <IconWallet className="h-4 w-4" />
              </span>
              Conta bancária
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Banco" placeholder="Ex: 260 - Nu Pagamentos" value={banco} onChange={setBanco} />
              <Field label="Titular" placeholder="Nome completo do titular" value={titular} onChange={setTitular} />
              <Field label="Agência" placeholder="0001" value={agencia} onChange={setAgencia} mono />
              <Field label="Conta com dígito" placeholder="00000000-0" value={conta} onChange={setConta} mono />
              <Field label="CPF / CNPJ do titular" placeholder="000.000.000-00" value={doc} onChange={setDoc} mono />
            </div>
            <div className="mt-4">
              <SaveButton />
            </div>
          </section>
        </div>

        <section className="h-fit rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-300">
              <IconShield className="h-4 w-4" />
            </span>
            Suas taxas
          </h2>

          <ul className="mt-4 space-y-3">
            {[
              { m: "PIX", taxa: "3,99% + R$ 1,00", prazo: "Liberação em D+1", cor: "text-emerald-400" },
              { m: "Cartão de crédito", taxa: "6,99% + R$ 1,00", prazo: "Liberação em D+30", cor: "text-zen-red-bright" },
              { m: "Cartão de débito", taxa: "4,99% + R$ 1,00", prazo: "Liberação em D+1", cor: "text-zinc-300" },
            ].map((t) => (
              <li key={t.m} className="rounded-xl border border-zen-border bg-zen-bg p-3.5">
                <p className={`text-[13px] font-bold ${t.cor}`}>{t.m}</p>
                <p className="mt-1 text-lg font-extrabold">{t.taxa}</p>
                <p className="text-[11.5px] text-zen-muted">{t.prazo}</p>
              </li>
            ))}
          </ul>

          <p className="mt-4 rounded-xl border border-zen-red/25 bg-zen-red/5 p-3.5 text-[12px] leading-relaxed text-zinc-300">
            Vendendo acima de <span className="font-bold text-white">R$ 50 mil/mês</span> você entra
            no plano Scale e as taxas caem. Fale com seu gerente.
          </p>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------- Notificações ------------------------------- */

export function NotificationsPage() {
  const [state, setState] = useState({
    vendaAprovada: true,
    pixGerado: true,
    pixExpirado: false,
    cartaoRecusado: true,
    saque: true,
    email: true,
    push: false,
    resumoDiario: true,
    novidades: false,
  });

  const set = (k: keyof typeof state) => (v: boolean) =>
    setState((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificações"
        subtitle="Escolha o que você quer saber na hora e o que pode esperar o resumo do dia."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zen-red/15 text-zen-red-bright">
              <IconBell className="h-4 w-4" />
            </span>
            Eventos de venda
          </h2>
          <div className="mt-2">
            <SettingRow
              title="Venda aprovada"
              desc="Avisa toda vez que um pagamento cai na conta."
              checked={state.vendaAprovada}
              onChange={set("vendaAprovada")}
            />
            <SettingRow
              title="PIX gerado"
              desc="Avisa quando um cliente gera o QR Code."
              checked={state.pixGerado}
              onChange={set("pixGerado")}
            />
            <SettingRow
              title="PIX expirado"
              desc="Avisa quando um PIX vence sem pagamento."
              checked={state.pixExpirado}
              onChange={set("pixExpirado")}
            />
            <SettingRow
              title="Cartão recusado"
              desc="Avisa quando uma tentativa no cartão é negada."
              checked={state.cartaoRecusado}
              onChange={set("cartaoRecusado")}
            />
            <SettingRow
              title="Saque realizado"
              desc="Avisa quando um saque é enviado para sua conta."
              checked={state.saque}
              onChange={set("saque")}
            />
          </div>
        </section>

        <section className="h-fit rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-300">
              <IconBell className="h-4 w-4" />
            </span>
            Canais e resumos
          </h2>
          <div className="mt-2">
            <SettingRow
              title="E-mail"
              desc="Recebe os avisos no e-mail da conta."
              checked={state.email}
              onChange={set("email")}
            />
            <SettingRow
              title="Push no navegador"
              desc="Notificação instantânea enquanto o painel está aberto."
              checked={state.push}
              onChange={set("push")}
            />
            <SettingRow
              title="Resumo diário"
              desc="Um e-mail por dia com o fechamento das vendas."
              checked={state.resumoDiario}
              onChange={set("resumoDiario")}
            />
            <SettingRow
              title="Novidades da ZenPay"
              desc="Novos recursos, taxas e comunicados."
              checked={state.novidades}
              onChange={set("novidades")}
            />
          </div>
          <div className="mt-4">
            <SaveButton label="Salvar preferências" />
          </div>
        </section>
      </div>
    </div>
  );
}
