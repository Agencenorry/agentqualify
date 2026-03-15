"use client";

import { useState, useCallback } from "react";
import type { Trigger, TriggerType } from "@/lib/types";

const MAX_TRIGGERS = 10;

const TYPE_LABELS: Record<TriggerType, string> = {
  click: "Clic sur un élément",
  page: "Visite d'une page",
  timer: "Temps sur une page",
  scroll: "Scroll vers un élément",
};

const TYPE_ICONS: Record<TriggerType, string> = {
  click: "🖱️",
  page: "📄",
  timer: "⏱️",
  scroll: "📜",
};

const TYPE_BADGE_CLASS: Record<TriggerType, string> = {
  click: "bg-blue-100 text-blue-700",
  page: "bg-emerald-100 text-emerald-700",
  timer: "bg-amber-100 text-amber-700",
  scroll: "bg-violet-100 text-violet-700",
};

function configSummary(trigger: Trigger): string {
  switch (trigger.type) {
    case "click":
      return "Sélecteur : " + (trigger.config.selector || "—");
    case "page":
      return "URL contient : " + (trigger.config.path || "—") + (trigger.config.delaySeconds != null ? ` · Délai ${trigger.config.delaySeconds}s` : "");
    case "timer":
      return (trigger.config.path ? "Page : " + trigger.config.path + " · " : "") + (trigger.config.seconds ?? 0) + " secondes";
    case "scroll":
      if (trigger.config.selector) return "Élément : " + trigger.config.selector;
      return "Scroll : " + (trigger.config.threshold ?? 80) + "%";
    default:
      return "";
  }
}

function generateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "x" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type TriggerEditorProps = {
  clientId: string;
  triggers: Trigger[];
  onUpdate: (triggers: Trigger[]) => void;
};

export function TriggerEditor({ clientId, triggers, onUpdate }: TriggerEditorProps) {
  const [list, setList] = useState<Trigger[]>(triggers);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TriggerType | null>(null);
  const [form, setForm] = useState<Partial<Trigger>>({});

  const saveToServer = useCallback(
    async (newList: Trigger[]) => {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggers: newList }),
      });
      if (!res.ok) return;
      onUpdate(newList);
    },
    [clientId, onUpdate]
  );

  const handleToggleActive = async (id: string) => {
    const newList = list.map((t) => (t.id === id ? { ...t, active: !t.active } : t));
    setList(newList);
    await saveToServer(newList);
  };

  const handleDelete = async (id: string) => {
    const newList = list.filter((t) => t.id !== id);
    setList(newList);
    await saveToServer(newList);
  };

  const handleLabelChange = async (id: string, label: string) => {
    const newList = list.map((t) => (t.id === id ? { ...t, label } : t));
    setList(newList);
    await saveToServer(newList);
  };

  const openAdd = () => {
    setEditingId(null);
    setSelectedType(null);
    setForm({});
    setStep(1);
    setModalOpen(true);
  };

  const openEdit = (t: Trigger) => {
    setEditingId(t.id);
    setSelectedType(t.type);
    setForm({ ...t });
    setStep(2);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setStep(1);
    setSelectedType(null);
    setForm({});
    setEditingId(null);
  };

  const chooseType = (type: TriggerType) => {
    setSelectedType(type);
    const base: Partial<Trigger> = {
      id: editingId ?? generateId(),
      type,
      label: "",
      active: true,
      config: type === "click" ? { selector: "" } : type === "page" ? { path: "", delaySeconds: 2 } : type === "timer" ? { seconds: 30 } : { threshold: 80 },
    };
    setForm(base);
    setStep(2);
  };

  const saveTrigger = async () => {
    if (!selectedType || !form.label) return;
    const config = form.config as Trigger["config"];
    if (selectedType === "click" && (!config || !(config as { selector?: string }).selector)) return;
    if (selectedType === "page" && (!config || !(config as { path?: string }).path)) return;
    if (selectedType === "timer" && (!config || (config as { seconds?: number }).seconds == null)) return;

    const newTrigger: Trigger = {
      id: form.id ?? generateId(),
      type: selectedType,
      label: form.label,
      config: config ?? {},
      active: form.active !== false,
    };
    let newList: Trigger[];
    if (editingId) {
      newList = list.map((t) => (t.id === editingId ? newTrigger : t));
    } else {
      if (list.length >= MAX_TRIGGERS) return;
      newList = [...list, newTrigger];
    }
    setList(newList);
    await saveToServer(newList);
    closeModal();
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-zinc-900">Déclencheurs</h3>
          <p className="text-sm text-zinc-500">Définissez quand l'agent prend la parole</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={list.length >= MAX_TRIGGERS}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          + Ajouter un déclencheur
        </button>
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center text-sm text-zinc-500">
          Aucun déclencheur configuré — l'agent ne s'ouvrira pas automatiquement.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-4"
            >
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_CLASS[t.type]}`}>
                {TYPE_ICONS[t.type]} {TYPE_LABELS[t.type]}
              </span>
              <input
                type="text"
                defaultValue={t.label}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== t.label) handleLabelChange(t.id, v);
                }}
                className="min-w-[180px] flex-1 rounded border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900"
              />
              <span className="text-xs text-zinc-500">{configSummary(t)}</span>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={t.active}
                  onChange={() => handleToggleActive(t.id)}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-600">Actif</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(t)}
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {step === 1 ? (
              <>
                <h4 className="mb-4 font-medium text-zinc-900">Choisir le type de déclencheur</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(["click", "page", "timer", "scroll"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => chooseType(type)}
                      className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 text-left transition hover:border-zinc-400 hover:bg-zinc-50"
                    >
                      <span className="text-2xl">{TYPE_ICONS[type]}</span>
                      <span className="font-medium text-zinc-900">{TYPE_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={closeModal} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className="mb-4 font-medium text-zinc-900">
                  {editingId ? "Modifier le déclencheur" : "Configurer le déclencheur"}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm text-zinc-600">Label</label>
                    <input
                      type="text"
                      value={form.label ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                      placeholder="ex: Clic sur le bouton Nos services"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                    />
                  </div>
                  {selectedType === "click" && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm text-zinc-600">Sélecteur CSS</label>
                        <input
                          type="text"
                          value={(form.config as { selector?: string })?.selector ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              config: { ...(f.config as object), selector: e.target.value },
                            }))
                          }
                          placeholder="#btn-services, .cta-contact"
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                        />
                      </div>
                      <p className="text-xs text-zinc-500">
                        Ajoutez <code className="rounded bg-zinc-100 px-1">data-aq-trigger</code> sur l'élément HTML pour une intégration sans CSS.
                      </p>
                    </>
                  )}
                  {selectedType === "page" && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm text-zinc-600">URL contient</label>
                        <input
                          type="text"
                          value={(form.config as { path?: string })?.path ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              config: { ...(f.config as object), path: e.target.value },
                            }))
                          }
                          placeholder="/tarifs, /services"
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-zinc-600">
                          Délai avant ouverture : {(form.config as { delaySeconds?: number })?.delaySeconds ?? 2} s
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          value={(form.config as { delaySeconds?: number })?.delaySeconds ?? 2}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              config: { ...(f.config as object), delaySeconds: Number(e.target.value) },
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                  {selectedType === "timer" && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm text-zinc-600">URL contient (vide = toutes les pages)</label>
                        <input
                          type="text"
                          value={(form.config as { path?: string })?.path ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              config: { ...(f.config as object), path: e.target.value },
                            }))
                          }
                          placeholder="/tarifs ou vide"
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-zinc-600">
                          Temps sur la page : {(form.config as { seconds?: number })?.seconds ?? 30} secondes
                        </label>
                        <input
                          type="range"
                          min={5}
                          max={120}
                          value={(form.config as { seconds?: number })?.seconds ?? 30}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              config: { ...(f.config as object), seconds: Number(e.target.value) },
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                  {selectedType === "scroll" && (
                    <>
                      <div>
                        <label className="mb-2 block text-sm text-zinc-600">Méthode</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="scrollMethod"
                              checked={!!(form.config as { selector?: string })?.selector}
                              onChange={() =>
                                setForm((f) => ({
                                  ...f,
                                  config: { selector: "", threshold: undefined },
                                }))
                              }
                            />
                            <span className="text-sm">Sélecteur CSS d'un élément</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="scrollMethod"
                              checked={!(form.config as { selector?: string })?.selector}
                              onChange={() =>
                                setForm((f) => ({
                                  ...f,
                                  config: { selector: undefined, threshold: (f.config as { threshold?: number })?.threshold ?? 80 },
                                }))
                              }
                            />
                            <span className="text-sm">% de la page scrollée</span>
                          </label>
                        </div>
                      </div>
                      {"selector" in (form.config || {}) ? (
                        <div>
                          <label className="mb-1 block text-sm text-zinc-600">Sélecteur CSS</label>
                          <input
                            type="text"
                            value={(form.config as { selector?: string })?.selector ?? ""}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                config: { ...(f.config as object), selector: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="mb-1 block text-sm text-zinc-600">
                            Pourcentage scrollé : {(form.config as { threshold?: number })?.threshold ?? 80}%
                          </label>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            value={(form.config as { threshold?: number })?.threshold ?? 80}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                config: { ...(f.config as object), threshold: Number(e.target.value) },
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => (editingId ? closeModal() : setStep(1))} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={saveTrigger}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    Enregistrer le déclencheur
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
