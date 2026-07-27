"use client";

import { useState } from "react";
import { PageHeader, MiniStat } from "./shared";
import {
  IconWallet,
  IconPix,
  IconBitcoin,
  IconBell,
  IconGlobe,
  IconApi,
  IconGift,
  IconCopy,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconShield,
  IconPlus,
  IconTrash,
  IconUsers,
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

/* ------------------------------ Saque em Cripto ----------------------------- */

export function CryptoPage() {
  const [wallet, setWallet] = useState("");
  const [rede, setRede] = useState("TRC20");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saque em Cripto"
        subtitle="Receba seu saldo em USDT direto na sua carteira, sem passar pelo banco."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat
          icon={<IconBitcoin className="h-4 w-4" />}
          iconClass="bg-zen-red/15 text-zen-red-bright"
          label="Saldo convertível"
          value="R$ 0,00"
          highlight
        />
        <MiniStat
          icon={<IconBitcoin className="h-4 w-4" />}
          iconClass="bg-emerald-500/10 text-emerald-400"
          label="Cotação USDT"
          value="R$ 5,42"
          sub="atualizada agora"
        />
        <MiniStat
          icon={<IconWallet className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Você receberia"
          value="0,00 USDT"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zen-red/15 text-zen-red-bright">
              <IconBitcoin className="h-4 w-4" />
            </span>
            Sua carteira USDT
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">Rede</p>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {["TRC20", "ERC20", "BEP20"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRede(r)}
                    className={`rounded-xl py-2.5 text-[12.5px] font-bold transition ${
                      rede === r
                        ? "bg-zen-red text-white shadow-red-soft"
                        : "border border-zen-border bg-zen-bg text-zinc-400 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11.5px] text-zen-muted">
                TRC20 tem a menor taxa de rede. Confira a rede antes de salvar.
              </p>
            </div>

            <Field
              label="Endereço da carteira"
              placeholder="TX0000000000000000000000000000000000"
              value={wallet}
              onChange={setWallet}
              mono
            />

            <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
              <span className="mt-0.5 text-amber-400">
                <IconShield className="h-4 w-4" />
              </span>
              <p className="text-[12px] leading-relaxed text-zinc-300">
                Confira o endereço com atenção. Transferências em cripto são{" "}
                <span className="font-bold text-white">irreversíveis</span> — se o endereço estiver
                errado, o valor não pode ser recuperado.
              </p>
            </div>

            <SaveButton label="Salvar carteira" />
          </div>
        </section>

        <section className="h-fit rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="text-[15px] font-bold">Histórico de saques</h2>
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-zen-border text-zen-muted">
              <IconBitcoin className="h-5 w-5" />
            </span>
            <p className="max-w-[220px] text-[13px] text-zen-muted">
              Nenhum saque em cripto ainda.
            </p>
          </div>
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

/* ------------------------------- Trackeamento ------------------------------- */

export function TrackingPage() {
  const [meta, setMeta] = useState("");
  const [google, setGoogle] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [gtm, setGtm] = useState("");

  const pixels = [
    {
      nome: "Meta Pixel",
      desc: "Facebook e Instagram Ads",
      placeholder: "000000000000000",
      value: meta,
      set: setMeta,
      cor: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      nome: "Google Ads",
      desc: "Tag de conversão do Google",
      placeholder: "AW-000000000",
      value: google,
      set: setGoogle,
      cor: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      nome: "TikTok Pixel",
      desc: "TikTok Ads Manager",
      placeholder: "C0000000000000000000",
      value: tiktok,
      set: setTiktok,
      cor: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      nome: "Google Tag Manager",
      desc: "Container GTM",
      placeholder: "GTM-XXXXXXX",
      value: gtm,
      set: setGtm,
      cor: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trackeamento"
        subtitle="Conecte seus pixels para medir conversão direto no checkout da ZenPay."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {pixels.map((p) => (
          <section key={p.nome} className="rounded-2xl border border-zen-border bg-zen-card p-5">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${p.bg} ${p.cor}`}>
                <IconGlobe className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-[14.5px] font-bold">{p.nome}</h2>
                <p className="text-[12px] text-zen-muted">{p.desc}</p>
              </div>
              <span
                className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                  p.value.trim()
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-zinc-500/10 text-zinc-400"
                }`}
              >
                {p.value.trim() ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="mt-4">
              <Field
                label="ID do pixel"
                placeholder={p.placeholder}
                value={p.value}
                onChange={p.set}
                mono
              />
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zen-red/25 bg-zen-red/5 px-5 py-4">
        <p className="text-[12.5px] leading-relaxed text-zinc-300">
          Os eventos <span className="font-bold text-white">PageView</span>,{" "}
          <span className="font-bold text-white">InitiateCheckout</span> e{" "}
          <span className="font-bold text-white">Purchase</span> são disparados automaticamente no
          checkout.
        </p>
        <SaveButton label="Salvar pixels" />
      </div>
    </div>
  );
}

/* ----------------------------- API & Webhooks ------------------------------ */

export function ApiPage() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [hooks, setHooks] = useState<string[]>([]);
  const [novoHook, setNovoHook] = useState("");

  const publicKey = "zp_pub_7f4c1e9a2b8d5063a1c4e7f0";
  const secretKey = "zp_sec_c8e2a94b16d7f350be9c2a1d47f8069e";

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard bloqueado
    }
  }

  function addHook(e: React.FormEvent) {
    e.preventDefault();
    const url = novoHook.trim();
    if (!url.startsWith("http")) return;
    setHooks([url, ...hooks]);
    setNovoHook("");
  }

  const eventos = [
    "payment.created",
    "payment.approved",
    "payment.refused",
    "payment.expired",
    "payment.refunded",
    "withdraw.completed",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="API & Webhooks"
        subtitle="Suas chaves de integração e para onde a ZenPay avisa cada evento."
      />

      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-5 py-4">
        <span className="mt-0.5 text-amber-400">
          <IconShield className="h-4 w-4" />
        </span>
        <p className="text-[12.5px] leading-relaxed text-zinc-300">
          A API pública ainda está em desenvolvimento. As chaves abaixo são de{" "}
          <span className="font-bold text-white">demonstração</span> e ainda não autenticam
          requisições reais.
        </p>
      </div>

      <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zen-red/15 text-zen-red-bright">
            <IconApi className="h-4 w-4" />
          </span>
          Suas chaves
        </h2>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">
              Chave pública
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <p className="flex-1 truncate rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 font-mono text-[12.5px] text-zinc-300">
                {publicKey}
              </p>
              <button
                onClick={() => copy(publicKey, "pub")}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  copied === "pub"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-zen-border bg-zen-bg text-zinc-400 hover:text-white"
                }`}
              >
                {copied === "pub" ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-zen-muted">
              Chave secreta
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <p className="flex-1 truncate rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 font-mono text-[12.5px] text-zinc-300">
                {showKey ? secretKey : "•".repeat(36)}
              </p>
              <button
                onClick={() => setShowKey((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zen-border bg-zen-bg text-zinc-400 transition hover:text-white"
              >
                {showKey ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => copy(secretKey, "sec")}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  copied === "sec"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-zen-border bg-zen-bg text-zinc-400 hover:text-white"
                }`}
              >
                {copied === "sec" ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[11.5px] text-zen-muted">
              Nunca exponha a chave secreta no front-end do seu site.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-300">
              <IconGlobe className="h-4 w-4" />
            </span>
            Endpoints de webhook
          </h2>

          <form onSubmit={addHook} className="mt-4 flex gap-2">
            <input
              type="text"
              value={novoHook}
              onChange={(e) => setNovoHook(e.target.value)}
              placeholder="https://seusite.com/webhooks/zenpay"
              className="flex-1 rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 font-mono text-[12.5px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark px-4 text-[12.5px] font-bold text-white shadow-red-soft transition hover:brightness-110"
            >
              <IconPlus className="h-4 w-4" />
              Adicionar
            </button>
          </form>

          {hooks.length === 0 ? (
            <p className="mt-6 py-8 text-center text-[13px] text-zen-muted">
              Nenhum endpoint cadastrado.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {hooks.map((h, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <p className="min-w-0 flex-1 truncate font-mono text-[12px] text-zinc-300">{h}</p>
                  <button
                    onClick={() => setHooks(hooks.filter((_, idx) => idx !== i))}
                    className="text-zinc-500 transition hover:text-zen-red-bright"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-zen-border bg-zen-card p-5">
          <h2 className="text-[15px] font-bold">Eventos disponíveis</h2>
          <p className="mt-1 text-[12px] text-zen-muted">
            Enviados via POST em JSON para cada endpoint.
          </p>
          <ul className="mt-4 space-y-1.5">
            {eventos.map((ev) => (
              <li
                key={ev}
                className="rounded-lg border border-zen-border bg-zen-bg px-3 py-2 font-mono text-[12px] text-zinc-300"
              >
                {ev}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------- Indicações -------------------------------- */

export function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const code = "ZENLUIS";
  const link = `https://zenpay.vercel.app/r/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard bloqueado
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indicações"
        subtitle="Indique a ZenPay e ganhe uma parte da taxa de cada venda que seus indicados fizerem."
      />

      <section className="zen-gradient-hero relative overflow-hidden rounded-2xl border border-zen-border p-6 sm:p-8">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-zen-red-bright to-zen-blood" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] font-bold text-zinc-200 backdrop-blur-sm">
            <IconGift className="h-3.5 w-3.5" />
            PROGRAMA DE INDICAÇÃO
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
            Ganhe <span className="text-zen-red-bright">1%</span> de cada venda
          </h2>
          <p className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed text-zinc-300">
            Toda pessoa que criar conta pelo seu link vira seu indicado para sempre. Você recebe 1%
            sobre o volume que ela processar, direto no seu saldo.
          </p>

          <div className="mt-5 flex max-w-lg flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 truncate rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 font-mono text-[12.5px] text-zinc-200 backdrop-blur-sm">
              {link}
            </p>
            <button
              onClick={copy}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12.5px] font-bold transition ${
                copied
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-white text-zen-bg hover:bg-zinc-200"
              }`}
            >
              {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat
          icon={<IconUsers className="h-4 w-4" />}
          iconClass="bg-zen-red/15 text-zen-red-bright"
          label="Indicados"
          value="0"
          highlight
        />
        <MiniStat
          icon={<IconGift className="h-4 w-4" />}
          iconClass="bg-emerald-500/10 text-emerald-400"
          label="Comissão acumulada"
          value="R$ 0,00"
        />
        <MiniStat
          icon={<IconWallet className="h-4 w-4" />}
          iconClass="bg-white/5 text-zinc-300"
          label="Disponível para saque"
          value="R$ 0,00"
        />
      </div>

      <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
        <h2 className="text-[15px] font-bold">Seus indicados</h2>
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-zen-border text-zen-muted">
            <IconUsers className="h-5 w-5" />
          </span>
          <p className="max-w-[280px] text-[13px] text-zen-muted">
            Ninguém se cadastrou pelo seu link ainda. Compartilhe e comece a ganhar.
          </p>
        </div>
      </section>
    </div>
  );
}
