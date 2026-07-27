"use client";

import { useState } from "react";
import {
  IconLink,
  IconGlobe,
  IconLock,
  IconUser,
  IconUpload,
  IconPlus,
} from "../icons";

export default function ThemesPage() {
  const [tab, setTab] = useState<"bio" | "privado">("bio");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const previewUser = username.trim() || "seuusuario";
  const previewName = displayName.trim() || previewUser;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zen-red/15 text-zen-red-bright">
          <IconLink className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Meus Links</h1>
          <p className="mt-0.5 text-[13.5px] text-zen-muted">
            Bio pública e links privados de checkout.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl border border-zen-border bg-zen-card p-1">
        <button
          onClick={() => setTab("bio")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition ${
            tab === "bio" ? "bg-zen-red text-white shadow-red-soft" : "text-zen-muted hover:text-zinc-200"
          }`}
        >
          <IconGlobe className="h-4 w-4" />
          Bio Link
        </button>
        <button
          onClick={() => setTab("privado")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition ${
            tab === "privado" ? "bg-zen-red text-white shadow-red-soft" : "text-zen-muted hover:text-zinc-200"
          }`}
        >
          <IconLock className="h-4 w-4" />
          Link Privado
          <span className="rounded-full bg-zen-red px-1.5 py-0.5 text-[9px] font-bold text-white">
            NOVO
          </span>
        </button>
      </div>

      {tab === "bio" ? (
        <>
          <p className="text-[13px] text-zen-muted">
            Crie sua página pública estilo Linktree e venda direto pelo Telegram, Instagram ou onde
            quiser.
          </p>

          {/* Suas páginas */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zen-border bg-zen-card px-5 py-4">
            <div>
              <p className="flex items-center gap-2 text-[14px] font-bold">
                <IconLink className="h-4 w-4 text-zen-red-bright" />
                Suas páginas <span className="text-[12px] font-semibold text-zen-muted">(0/10)</span>
              </p>
              <p className="mt-0.5 text-[12px] text-zen-muted">
                Você pode ter até 10 páginas (uma por nicho, marca ou campanha).
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-zen-border bg-zen-bg px-4 py-2 text-[12.5px] font-semibold text-zinc-300 transition hover:border-zen-red/40 hover:text-white">
              <IconPlus className="h-4 w-4" />
              Nova Bio Link
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              {/* URL */}
              <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zen-red/15 text-zen-red-bright">
                    <IconGlobe className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-[14.5px] font-bold">Escolha o endereço da sua página</h3>
                    <p className="text-[12px] text-zen-muted">
                      Esse é o link que você vai compartilhar (na bio do Instagram, TikTok, etc.).
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-zen-muted">
                  URL pública
                </p>
                <div className="mt-1.5 flex items-center overflow-hidden rounded-xl border border-zen-border bg-zen-bg focus-within:border-zen-red/60 focus-within:ring-2 focus-within:ring-zen-red/20">
                  <span className="border-r border-zen-border bg-white/[0.03] px-3.5 py-2.5 font-mono text-[12px] text-zen-muted">
                    zenpay.digital/u/
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="seuusuario"
                    className="w-full bg-transparent px-3 py-2.5 text-[13px] outline-none placeholder:text-zinc-600"
                  />
                </div>
                <p className="mt-1.5 text-[11.5px] text-zen-muted">
                  3-32 caracteres: letras minúsculas, números, _ e -
                </p>
              </section>

              {/* Identidade */}
              <section className="rounded-2xl border border-zen-border bg-zen-card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zen-red/15 text-zen-red-bright">
                    <IconUser className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-[14.5px] font-bold">Personalize a sua identidade</h3>
                    <p className="text-[12px] text-zen-muted">
                      Foto, nome, bio e cor — é o que o visitante vê no topo da página.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-zen-muted">
                      Nome de exibição
                    </p>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome ou marca"
                      className="mt-1.5 w-full rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                    />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-zen-muted">
                      Foto / Avatar
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-zen-border text-zen-muted">
                        <IconUpload className="h-4 w-4" />
                      </div>
                      <button className="flex items-center gap-2 rounded-xl border border-zen-border bg-zen-bg px-4 py-2 text-[12.5px] font-semibold text-zinc-300 transition hover:border-zen-red/40 hover:text-white">
                        <IconUpload className="h-4 w-4" />
                        Enviar foto
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-zen-muted">JPG ou PNG até 8MB</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-zen-muted">Bio</p>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 280))}
                    placeholder="Uma descrição curta sobre você ou seu negócio"
                    rows={4}
                    className="mt-1.5 w-full resize-none rounded-xl border border-zen-border bg-zen-bg px-4 py-2.5 text-[13px] outline-none transition placeholder:text-zinc-600 focus:border-zen-red/60 focus:ring-2 focus:ring-zen-red/20"
                  />
                  <p className="mt-1 text-right text-[11px] text-zen-muted">{bio.length}/280</p>
                </div>
              </section>

              {/* CTA */}
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zen-red/25 bg-zen-red/5 px-5 py-4">
                <div>
                  <p className="text-[14px] font-bold">Pronto para criar sua página?</p>
                  <p className="text-[12px] text-zen-muted">
                    Depois de criar, você poderá adicionar botões.
                  </p>
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-zen-red to-zen-red-dark px-5 py-2.5 text-sm font-semibold text-white shadow-red-soft transition hover:brightness-110">
                  <IconLink className="h-4 w-4" />
                  Criar Bio Link
                </button>
              </section>
            </div>

            {/* Preview do celular */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-zen-muted">
                Pré-visualização
              </p>
              <div className="mx-auto w-full max-w-[300px] rounded-[36px] border-4 border-zen-border bg-gradient-to-b from-[#1c0a0a] via-zen-bg to-[#2a0d0d] p-5 shadow-red-glow">
                <div className="mx-auto mb-6 h-1.5 w-16 rounded-full bg-zen-border" />
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-zen-red to-zen-blood text-3xl font-extrabold text-white">
                      {previewName.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-zen-bg bg-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-extrabold">{previewName}</p>
                    <p className="text-[12px] text-zen-muted">@{previewUser}</p>
                  </div>
                  {bio.trim() && (
                    <p className="max-w-[220px] text-center text-[12px] leading-relaxed text-zinc-300">
                      {bio}
                    </p>
                  )}
                  <p className="py-10 text-[12.5px] text-zen-muted">Sem links por aqui ainda.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zen-border bg-zen-card/50 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zen-red/10 text-zen-red-bright">
            <IconLock className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold">Link Privado</h2>
            <p className="mt-1 max-w-sm text-[13px] text-zen-muted">
              Gere links de checkout privados com valor personalizado. Em breve nesta área.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
