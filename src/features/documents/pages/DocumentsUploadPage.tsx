// src/features/documents/pages/DocumentsUploadPage.tsx

/**
 * @module features/documents/pages/DocumentsUploadPage
 * @description
 * Ajout d'un document au dossier d'un candidat (permis, pièce d'identité,
 * facture, reçu…). `?candidatId=` pré-sélectionne le candidat.
 * Le fichier est copié dans le dossier de l'application et référencé en base.
 */

import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, FileUp, FolderOpen, GraduationCap, HardDrive, Tag } from 'lucide-react';

import FormWrapper from '@/components/forms/FormWrapper';
import { FileDropzone } from '@/components/forms/FileDropzone';
import { EntityCombobox, type EntityOption } from '@/components/forms/EntityCombobox';
import {
  CompletionGauge,
  InfoRow,
  PageHeader,
  RequiredChecklist,
  SectionHeader,
  errorMessage,
} from '@/components/forms/FormPageKit';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { cn } from '@/lib/utils';

import { useDocuments } from '@/hooks/use.documents';
import { useCandidats } from '@/hooks/use.candidats';
import { PROTECTED_ROUTES } from '@/config';
import { DOCUMENT_TYPE_VALUES } from '@/lib/validators/documents.validator';
import type { Candidat } from '@/types/candidats.types';

type TypeDocument = (typeof DOCUMENT_TYPE_VALUES)[number];

const TYPES: Record<TypeDocument, { label: string; description: string }> = {
  carte_identite: { label: "Pièce d'identité", description: "Carte nationale d'identité, passeport…" },
  permis: { label: 'Permis', description: 'Permis obtenu ou en cours (copie)' },
  facture: { label: 'Facture', description: 'Facture signée ou acquittée' },
  recu: { label: 'Reçu', description: 'Reçu de paiement' },
  autre: { label: 'Autre', description: 'Certificat médical, photo, attestation…' },
};
const ORDRE: TypeDocument[] = ['carte_identite', 'permis', 'facture', 'recu', 'autre'];

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp';

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;

/** URL d'aperçu (blob) d'un fichier, libérée automatiquement. */
function useObjectUrl(file: File | null) {
  const url = React.useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  React.useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

function DocumentPreview({
  file,
  type,
  candidat,
}: {
  file: File | null;
  type: TypeDocument | null;
  candidat?: Candidat;
}) {
  const url = useObjectUrl(file);
  const isImage = file?.type.startsWith('image/');
  const isPdf = file?.type === 'application/pdf';
  const required = [
    { label: 'Candidat', filled: Boolean(candidat) },
    { label: 'Type de document', filled: Boolean(type) },
    { label: 'Fichier', filled: Boolean(file) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex h-56 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
        {url && isImage ? (
          <img src={url} alt={file?.name} className="h-full w-full object-contain" />
        ) : url && isPdf ? (
          <iframe src={url} title={file?.name} className="h-full w-full" />
        ) : (
          <div className="text-center text-muted-foreground">
            <FileText className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-2 text-xs">Aperçu du document</p>
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <InfoRow accent="indigo" icon={GraduationCap} value={candidat && `${candidat.prenom} ${candidat.nom}`} placeholder="Candidat —" />
        <InfoRow accent="indigo" icon={Tag} value={type && TYPES[type].label} placeholder="Type —" />
        <InfoRow accent="indigo" icon={FileText} value={file?.name} placeholder="Fichier —" />
        <InfoRow accent="indigo" icon={HardDrive} value={file && formatSize(file.size)} placeholder="Taille —" />
      </div>
      <CompletionGauge filled={required.filter((r) => r.filled).length} total={required.length} />
      <RequiredChecklist items={required} />
    </div>
  );
}

export default function DocumentsUploadPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { upload } = useDocuments();
  const { getAll: getCandidats } = useCandidats();

  const initialCandidat = Number(params.get('candidatId'));
  const [candidats, setCandidats] = React.useState<Candidat[]>([]);
  const [candidatsLoading, setCandidatsLoading] = React.useState(true);
  const [candidatId, setCandidatId] = React.useState<number | null>(
    Number.isInteger(initialCandidat) && initialCandidat > 0 ? initialCandidat : null
  );
  const [type, setType] = React.useState<TypeDocument | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getCandidats({ page: 1, limit: 1000 })
      .then((r) => !cancelled && setCandidats(r.candidats ?? []))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Impossible de charger les candidats.')))
      .finally(() => !cancelled && setCandidatsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [getCandidats]);

  const candidat = candidats.find((c) => c.id === candidatId);
  const isValid = Boolean(candidatId && type && file);

  const options: EntityOption[] = candidats.map((c) => ({
    id: c.id,
    label: `${c.prenom} ${c.nom}`,
    sublabel: `Permis ${c.categorie}${c.telephone ? ` · ${c.telephone}` : ''}`,
    keywords: `${c.email ?? ''}`,
  }));

  const handleSubmit = async () => {
    if (!candidatId || !type || !file) {
      toast.error('Formulaire incomplet', { description: 'Choisissez un candidat, un type et un fichier.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const buffer = await file.arrayBuffer();
      await upload({
        candidatId,
        type,
        buffer,
        originalName: file.name,
        mimeType: file.type || undefined,
      });
      toast.success('Document ajouté', { description: `${file.name} · ${candidat ? `${candidat.prenom} ${candidat.nom}` : ''}` });
      navigate(params.get('candidatId') ? PROTECTED_ROUTES.CANDIDATS.DETAIL(candidatId) : PROTECTED_ROUTES.DOCUMENTS.LIST);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={FileUp} title="Nouveau document" badge="Ajout" />

      <FormWrapper
        title="Document à ajouter"
        description="Le fichier est copié dans le dossier de l'application et rattaché au candidat."
        icon={FileUp}
        onSubmit={() => void handleSubmit()}
        onCancel={() => navigate(-1)}
        isSubmitting={isSubmitting}
        isValid={isValid}
        submitLabel="Ajouter le document"
        cancelLabel="Annuler"
        previewTitle="Aperçu"
        preview={<DocumentPreview file={file} type={type} candidat={candidat} />}
      >
        <div className="space-y-8">
          <section className="space-y-4">
            <SectionHeader icon={GraduationCap} title="Candidat" description="Dossier dans lequel ranger le document." />
            <EntityCombobox
              options={options}
              value={candidatId}
              onChange={setCandidatId}
              icon={GraduationCap}
              placeholder="Choisir un candidat"
              searchPlaceholder="Nom, téléphone, e-mail…"
              emptyText="Aucun candidat trouvé."
              loading={candidatsLoading}
              disabled={isSubmitting}
            />
          </section>

          <Separator className="my-2" />

          <section className="space-y-4">
            <SectionHeader icon={Tag} title="Type de document" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Type de document">
              {ORDRE.map((t) => {
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isSubmitting}
                    onClick={() => setType(t)}
                    className={cn(
                      'rounded-md border p-3 text-left transition-colors',
                      active ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'hover:bg-muted/50'
                    )}
                  >
                    <span className="block text-sm font-medium">{TYPES[t].label}</span>
                    <span className="block text-xs text-muted-foreground">{TYPES[t].description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <Separator className="my-2" />

          <section className="space-y-4">
            <SectionHeader icon={FolderOpen} title="Fichier" />
            <Field>
              <FieldLabel className="sr-only">Fichier</FieldLabel>
              <FileDropzone
                value={file}
                onChange={setFile}
                accept={ACCEPT}
                maxSize={MAX_SIZE}
                label="Déposez le fichier ici"
                description="PDF, PNG, JPEG ou WebP — 10 Mo maximum."
                browseLabel="Parcourir"
                dropLabel="Relâchez pour ajouter le fichier"
                disabled={isSubmitting}
              />
              <FieldDescription>Le nom du fichier d'origine est conservé.</FieldDescription>
            </Field>
          </section>
        </div>
      </FormWrapper>

      <ErrorDialog
        open={error !== null}
        onOpenChange={(open) => !open && setError(null)}
        title="Ajout impossible"
        message={error ?? ''}
        closeText="Fermer"
      />
    </div>
  );
}
