'use client';

import { useState, useRef, Fragment } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { ParsedBudget, ParsedCoeficienteK } from '@construccion/shared';

type Step = 'upload' | 'parsing' | 'preview' | 'confirming';

interface ImportBudgetVersionDialogProps {
  projectId: string;
  onSuccess: (versionId: string) => void;
  onCancel: () => void;
}

export function ImportBudgetVersionDialog({
  projectId,
  onSuccess,
  onCancel,
}: ImportBudgetVersionDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [versionName, setVersionName] = useState('');
  const [parsedBudget, setParsedBudget] = useState<ParsedBudget | null>(null);
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warningsCollapsed, setWarningsCollapsed] = useState(true);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const parseMutation = useMutation({
    mutationFn: (f: File) => {
      const form = new FormData();
      form.append('file', f);
      return api.post<ParsedBudget>(
        `/projects/${projectId}/budget-versions/import/parse`,
        form
      );
    },
    onSuccess: (data) => {
      setParsedBudget(data);
      setAdvertencias(data.advertencias);
      setStep('preview');
    },
    onError: (err: any) => {
      setError(err.message || 'Error al analizar el archivo');
      setStep('upload');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>(`/projects/${projectId}/budget-versions/import/confirm`, {
        name: versionName,
        parsedBudget,
      }),
    onSuccess: (data) => {
      onSuccess(data.id);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear la versión');
      setStep('preview');
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setVersionName(f.name.replace(/\.(xlsx?|xls)$/i, ''));
      setError(null);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo supera el límite de 10 MB');
      return;
    }
    setError(null);
    setStep('parsing');
    parseMutation.mutate(file);
  };

  // ── Update helpers ──────────────────────────────────────────────────────────

  const updateK = (field: keyof ParsedCoeficienteK, value: number) => {
    setParsedBudget((prev) =>
      prev ? { ...prev, coeficienteK: { ...prev.coeficienteK, [field]: value } } : null
    );
  };

  const updateStage = (catIdx: number, stageIdx: number, field: string, value: any) => {
    setParsedBudget((prev) => {
      if (!prev) return null;
      const cats = prev.categories.map((c, ci) => {
        if (ci !== catIdx) return c;
        return {
          ...c,
          stages: c.stages.map((s, si) =>
            si === stageIdx ? { ...s, [field]: value } : s
          ),
        };
      });
      return { ...prev, categories: cats };
    });
  };

  const updateItem = (catIdx: number, stageIdx: number, itemIdx: number, field: string, value: any) => {
    setParsedBudget((prev) => {
      if (!prev) return null;
      const cats = prev.categories.map((c, ci) => {
        if (ci !== catIdx) return c;
        return {
          ...c,
          stages: c.stages.map((s, si) => {
            if (si !== stageIdx) return s;
            return {
              ...s,
              items: s.items.map((it, ii) =>
                ii !== itemIdx ? it : { ...it, [field]: value }
              ),
            };
          }),
        };
      });
      return { ...prev, categories: cats };
    });
  };

  const kValue = parsedBudget
    ? (1 + parsedBudget.coeficienteK.gastosGeneralesPct) *
      (1 + parsedBudget.coeficienteK.beneficioPct) *
      (1 + parsedBudget.coeficienteK.gastosFinancierosPct) *
      (1 + parsedBudget.coeficienteK.ivaPct)
    : 1;

  // ── Render steps ───────────────────────────────────────────────────────────

  if (step === 'upload') {
    return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            {file ? file.name : 'Hacer clic para seleccionar archivo'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Excel .xlsx o .xls — máximo 10 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {file && (
          <div className="space-y-2">
            <label htmlFor="version-name" className="text-sm font-medium">Nombre de la versión</label>
            <Input
              id="version-name"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Presupuesto Base v1"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleAnalyze} disabled={!file || !versionName.trim()}>
            <Upload className="mr-2 h-4 w-4" />
            Analizar archivo
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'parsing') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analizando archivo...</p>
      </div>
    );
  }

  if (step === 'preview' && parsedBudget) {
    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {/* Advertencias */}
        {advertencias.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
            <button
              className="flex items-center gap-2 w-full text-yellow-800 font-medium"
              onClick={() => setWarningsCollapsed((v) => !v)}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {advertencias.length} advertencia{advertencias.length > 1 ? 's' : ''} detectada
              {advertencias.length > 1 ? 's' : ''}
              <span className="ml-auto text-xs">{warningsCollapsed ? '▼' : '▲'}</span>
            </button>
            {!warningsCollapsed && (
              <ul className="mt-2 space-y-1 text-yellow-700">
                {advertencias.map((a, i) => (
                  <li key={i} className="text-xs">• {a}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Coeficiente K */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Coeficiente K</h4>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                ['gastosGeneralesPct', 'GG %'],
                ['beneficioPct', 'Beneficio %'],
                ['gastosFinancierosPct', 'GF %'],
                ['ivaPct', 'IVA %'],
              ] as [keyof ParsedCoeficienteK, string][]
            ).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <label htmlFor={`k-field-${field}`} className="text-xs text-muted-foreground">{label}</label>
                <Input
                  id={`k-field-${field}`}
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={parsedBudget.coeficienteK[field]}
                  onChange={(e) => updateK(field, parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            K calculado: <strong>{kValue.toFixed(4)}</strong>
          </p>
        </div>

        {/* Ítems */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Ítems del presupuesto</h4>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2 w-20">Código</th>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-left p-2 w-14">Unidad</th>
                  <th className="text-right p-2 w-20">Cantidad</th>
                  <th className="text-right p-2 w-28">P. Unitario</th>
                  <th className="text-right p-2 w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {parsedBudget.categories.map((cat, catIdx) => (
                  <Fragment key={`cat-${catIdx}`}>
                    {/* Fila categoría */}
                    <tr className="bg-slate-100 font-medium">
                      <td className="p-2 text-slate-600">{cat.number}</td>
                      <td className="p-2 uppercase text-slate-700" colSpan={5}>
                        {cat.name}
                      </td>
                    </tr>

                    {cat.stages.map((stage, stageIdx) => (
                      <Fragment key={`stage-${catIdx}-${stageIdx}`}>
                        {stage.items.length > 0 ? (
                          /* Fila de etapa grupo (sin precio) */
                          <>
                            <tr className="bg-slate-50">
                              <td className="p-2 font-medium text-slate-600">{stage.number}</td>
                              <td className="p-2 font-medium text-slate-600" colSpan={5}>
                                {stage.description}
                              </td>
                            </tr>
                            {stage.items.map((item, itemIdx) => (
                              <tr
                                key={`item-${catIdx}-${stageIdx}-${itemIdx}`}
                                className="border-t hover:bg-muted/30"
                              >
                                <td className="p-1 pl-6 text-slate-500">{item.number}</td>
                                <td className="p-1">
                                  <input
                                    aria-label={`Descripción de ${item.number}`}
                                    className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1"
                                    value={item.description}
                                    onChange={(e) => updateItem(catIdx, stageIdx, itemIdx, 'description', e.target.value)}
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    aria-label={`Unidad de ${item.number}`}
                                    className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-center"
                                    value={item.unit}
                                    onChange={(e) => updateItem(catIdx, stageIdx, itemIdx, 'unit', e.target.value)}
                                  />
                                </td>
                                <td className="p-1 text-right">
                                  <input
                                    type="number"
                                    aria-label={`Cantidad de ${item.number}`}
                                    className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-right"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(catIdx, stageIdx, itemIdx, 'quantity', parseFloat(e.target.value) || 0)}
                                  />
                                </td>
                                <td className="p-1 text-right">
                                  <input
                                    type="number"
                                    aria-label={`Precio unitario de ${item.number}`}
                                    className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-right"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(catIdx, stageIdx, itemIdx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  />
                                </td>
                                <td className="p-2 text-right font-mono">
                                  {formatCurrency(item.quantity * item.unitPrice)}
                                </td>
                              </tr>
                            ))}
                          </>
                        ) : (
                          /* Fila etapa hoja (leaf) */
                          <tr className="border-t hover:bg-muted/30">
                            <td className="p-1">{stage.number}</td>
                            <td className="p-1">
                              <input
                                aria-label={`Descripción de ${stage.number}`}
                                className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1"
                                value={stage.description}
                                onChange={(e) => updateStage(catIdx, stageIdx, 'description', e.target.value)}
                              />
                            </td>
                            <td className="p-1">
                              <input
                                aria-label={`Unidad de ${stage.number}`}
                                className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-center"
                                value={stage.unit}
                                onChange={(e) => updateStage(catIdx, stageIdx, 'unit', e.target.value)}
                              />
                            </td>
                            <td className="p-1 text-right">
                              <input
                                type="number"
                                aria-label={`Cantidad de ${stage.number}`}
                                className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-right"
                                value={stage.quantity}
                                onChange={(e) => updateStage(catIdx, stageIdx, 'quantity', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-1 text-right">
                              <input
                                type="number"
                                aria-label={`Precio unitario de ${stage.number}`}
                                className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-right"
                                value={stage.unitPrice}
                                onChange={(e) => updateStage(catIdx, stageIdx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2 text-right font-mono">
                              {formatCurrency(stage.quantity * stage.unitPrice)}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* APUs detectados */}
        {(() => {
          const withApu = parsedBudget.categories
            .flatMap((c) => [
              ...c.stages.filter((s) => s.priceAnalysis),
              ...c.stages.flatMap((s) => s.items.filter((i) => i.priceAnalysis)),
            ]);
          if (withApu.length === 0) return null;
          return (
            <div>
              <h4 className="text-sm font-semibold mb-1">APUs detectados</h4>
              <p className="text-xs text-muted-foreground">
                Se importarán {withApu.length} Análisis de Precios Unitarios. Se pueden editar desde la vista de detalle después de importar.
              </p>
            </div>
          );
        })()}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={() => setStep('upload')}>
            Volver
          </Button>
          <Button
            onClick={() => {
              setStep('confirming');
              confirmMutation.mutate();
            }}
            disabled={confirmMutation.isPending}
          >
            {confirmMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando versión...
              </>
            ) : (
              'Crear versión de presupuesto'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // step === 'confirming' — spinner de espera mientras la mutación termina
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Creando versión de presupuesto...</p>
    </div>
  );
}
