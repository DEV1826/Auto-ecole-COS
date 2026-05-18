#!/bin/bash
# generate-features.sh
# Script de génération des pages pour l'auto-école COS
# À exécuter à la racine du projet (là où se trouve src/)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ ! -d "src" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Exécutez ce script à la racine du projet.${NC}"
    exit 1
fi

FEATURES_DIR="src/features"

# Fonction pour créer un fichier avec son dossier
create_file() {
    local file_path="$1"
    local content="$2"
    mkdir -p "$(dirname "$file_path")"
    printf "%s\n" "$content" > "$file_path"
    echo -e "${GREEN}✅ $file_path${NC}"
}

# ============================================================
# TEMPLATE POUR PAGE STATIQUE AVEC MESSAGE "EN CONSTRUCTION"
# ============================================================
read -r -d '' PAGE_TEMPLATE << 'EOF' || true
/**
 * @module features/{{FEATURE_NAME}}/pages/{{PAGE_NAME}}
 * @description {{PAGE_DESCRIPTION}}
 */

import { Construction } from "lucide-react";

export default function {{COMPONENT_NAME}}() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <Construction className="size-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        {{PAGE_TITLE}}
      </h1>
      <p className="text-muted-foreground max-w-md">
        Cette page est en cours de construction.
      </p>
    </div>
  );
}
EOF

# ============================================================
# DÉFINITION DES PAGES À GÉNÉRER
# Format : "feature|componentName|pageTitle|description|dynamic|routePattern"
# dynamic=true si la page utilise useParams (mais le template reste simple)
# ============================================================

PAGES=(
    # candidats
    "candidats|CandidatsListPage|Liste des candidats|Liste paginée des candidats|false|/candidats"
    "candidats|CandidatDetailPage|Détail candidat|Fiche complète d'un candidat|true|/candidats/:id"
    "candidats|CandidatCreatePage|Nouveau candidat|Création d'un candidat|false|/candidats/create"
    "candidats|CandidatEditPage|Modifier candidat|Édition d'un candidat|true|/candidats/:id/edit"

    # formations
    "formations|FormationsListPage|Liste des formations|Toutes les formations|false|/formations"
    "formations|FormationDetailPage|Détail formation|Description détaillée d'une formation|true|/formations/:id"
    "formations|FormationCreatePage|Nouvelle formation|Création d'une formation|false|/formations/create"
    "formations|FormationEditPage|Modifier formation|Édition d'une formation|true|/formations/:id/edit"
    "formations|FormationTarifsPage|Tarifs formation|Historique des tarifs|true|/formations/:id/tarifs"

    # moniteurs
    "moniteurs|MoniteursListPage|Liste des moniteurs|Tous les moniteurs|false|/moniteurs"
    "moniteurs|MoniteurDetailPage|Détail moniteur|Informations complètes|true|/moniteurs/:id"
    "moniteurs|MoniteurCreatePage|Nouveau moniteur|Ajout d'un moniteur|false|/moniteurs/create"
    "moniteurs|MoniteurEditPage|Modifier moniteur|Édition d'un moniteur|true|/moniteurs/:id/edit"
    "moniteurs|MoniteurPlanningPage|Planning moniteur|Planning individuel|true|/moniteurs/:id/planning"

    # vehicules
    "vehicules|VehiculesListPage|Liste des véhicules|Parc automobile|false|/vehicules"
    "vehicules|VehiculeDetailPage|Détail véhicule|Fiche technique et historique|true|/vehicules/:id"
    "vehicules|VehiculeCreatePage|Ajouter véhicule|Ajout au parc|false|/vehicules/create"
    "vehicules|VehiculeEditPage|Modifier véhicule|Édition|true|/vehicules/:id/edit"
    "vehicules|VehiculeEntretiensPage|Entretiens véhicule|Historique des entretiens|true|/vehicules/:id/entretiens"

    # planning
    "planning|PlanningCalendarPage|Calendrier planning|Vue calendrier des leçons|false|/planning"
    "planning|PlanningDetailPage|Détail leçon|Informations d'une leçon|true|/planning/:id"
    "planning|PlanningCreatePage|Nouvelle leçon|Création d'une leçon|false|/planning/create"
    "planning|PlanningEditPage|Modifier leçon|Édition d'une leçon|true|/planning/:id/edit"
    "planning|PlanningMoniteurPage|Planning moniteur|Leçons d'un moniteur|true|/planning/moniteur/:moniteurId"
    "planning|PlanningCandidatPage|Planning candidat|Leçons d'un candidat|true|/planning/candidat/:candidatId"

    # examens
    "examens|ExamensListPage|Liste des examens|Examens programmés|false|/examens"
    "examens|ExamenDetailPage|Détail examen|Résultats et informations|true|/examens/:id"
    "examens|ExamenCreatePage|Inscription examen|Inscrire un candidat|false|/examens/create"
    "examens|ExamenEditPage|Modifier examen|Modification d'un examen|true|/examens/:id/edit"
    "examens|ExamensParCandidatPage|Examens d'un candidat|Résultats par candidat|true|/examens/candidat/:candidatId"

    # paiements
    "paiements|PaiementsListPage|Liste des paiements|Tous les paiements|false|/paiements"
    "paiements|PaiementsParCandidatPage|Paiements candidat|Paiements d'un candidat|true|/paiements/candidat/:candidatId"
    "paiements|PaiementCreatePage|Nouveau paiement|Enregistrement d'un paiement|false|/paiements/create"
    "paiements|PaiementDetailPage|Détail paiement|Reçu du paiement|true|/paiements/:id"

    # factures
    "factures|FacturesListPage|Liste des factures|Factures émises|false|/factures"
    "factures|FactureDetailPage|Détail facture|Facture PDF|true|/factures/:id"
    "factures|FactureCreatePage|Nouvelle facture|Génération de facture|false|/factures/create"
    "factures|FactureEditPage|Modifier facture|Mise à jour (statut...)|true|/factures/:id/edit"

    # recus
    "recus|RecusListPage|Liste des reçus|Historique des reçus|false|/recus"
    "recus|RecuDetailPage|Détail reçu|Visualisation du reçu|true|/recus/:id"

    # depenses
    "depenses|DepensesListPage|Liste des dépenses|Toutes les dépenses|false|/depenses"
    "depenses|DepenseCreatePage|Nouvelle dépense|Enregistrement|false|/depenses/create"
    "depenses|DepenseEditPage|Modifier dépense|Mise à jour|true|/depenses/:id/edit"

    # caisse
    "caisse|CaisseIndexPage|Caisse|État de la caisse|false|/caisse"
    "caisse|CaisseEntreePage|Entrée de caisse|Enregistrement entrée|false|/caisse/entree"
    "caisse|CaisseSortiePage|Sortie de caisse|Enregistrement sortie|false|/caisse/sortie"
    "caisse|CaisseRelevePage|Relevé de caisse|Relevé périodique|false|/caisse/releve"

    # rapports
    "rapports|RapportFinancierPage|Rapport financier|Synthèse financière|false|/rapports/financier"
    "rapports|RapportCandidatsPage|Rapport candidats|Statistiques candidats|false|/rapports/candidats"
    "rapports|RapportLeconsPage|Rapport leçons|Heures par moniteur|false|/rapports/lecons"
    "rapports|RapportVehiculesPage|Rapport véhicules|Activité du parc|false|/rapports/vehicules"
    "rapports|RapportExportPage|Export de données|Génération de fichiers|false|/rapports/export"
    "rapports|RapportKPIPage|Tableau de bord KPI|Indicateurs clés|false|/rapports/kpi"

    # admin (sous-dossier admin pour les pages)
    "admin|AdminUsersListPage|Gestion des utilisateurs|Liste des utilisateurs|false|/admin/users"
    "admin|AdminUserDetailPage|Détail utilisateur|Informations utilisateur|true|/admin/users/:id"
    "admin|AdminUserCreatePage|Nouvel utilisateur|Création d'utilisateur|false|/admin/users/create"
    "admin|AdminUserEditPage|Modifier utilisateur|Édition utilisateur|true|/admin/users/:id/edit"
    "admin|AdminUserPermissionsPage|Permissions utilisateur|Gestion des droits|true|/admin/users/:id/permissions"
    "admin|AdminAuditLogsPage|Journaux d'audit|Logs système|false|/admin/audit-logs"
    "admin|AdminCompanyConfigPage|Configuration entreprise|Paramètres société|false|/admin/company"
    "admin|AdminSessionsPage|Sessions actives|Sessions utilisateurs|false|/admin/sessions"

    # utils (notifications, aide, api docs)
    "utils|NotificationsPage|Notifications|Messages système|false|/notifications"
    "utils|HelpPage|Aide|Centre d'aide|false|/help"
    "utils|ApiDocsPage|Documentation API|Référence API|false|/api-docs"
)

# ============================================================
# GÉNÉRATION DES PAGES ET DES INDEX PAR FEATURE
# ============================================================

declare -A FEATURE_EXPORTS

for page in "${PAGES[@]}"; do
    IFS='|' read -r feature component_name page_title description dynamic _ <<< "$page"

    # Créer le répertoire components (toujours présent)
    component_dir="$FEATURES_DIR/$feature/components"
    mkdir -p "$component_dir"
    if [ ! -f "$component_dir/index.ts" ]; then
        create_file "$component_dir/index.ts" "// Composants de la feature $feature"
    fi

    # Déterminer le dossier pages (éventuellement un sous-dossier ? non ici)
    page_dir="$FEATURES_DIR/$feature/pages"
    mkdir -p "$page_dir"

    # Remplacer les espaces dans le titre pour la description
    title_clean="${page_title// /_}"

    # Générer le contenu de la page
    content="$PAGE_TEMPLATE"
    content="${content//"{{FEATURE_NAME}}"/$feature}"
    content="${content//"{{PAGE_NAME}}"/$component_name}"
    content="${content//"{{COMPONENT_NAME}}"/$component_name}"
    content="${content//"{{PAGE_TITLE}}"/$page_title}"
    content="${content//"{{PAGE_DESCRIPTION}}"/$description}"

    # Chemin du fichier page
    page_file="$page_dir/$component_name.tsx"
    create_file "$page_file" "$content"

    # Ajouter l'export dans le tableau associatif
    FEATURE_EXPORTS["$feature"]+="export { default as $component_name } from './pages/$component_name';\n"
done

# ============================================================
# CRÉATION DES FICHIERS INDEX PAR FEATURE
# ============================================================

for feature in "${!FEATURE_EXPORTS[@]}"; do
    index_file="$FEATURES_DIR/$feature/index.ts"
    exports="${FEATURE_EXPORTS[$feature]}"
    # Ajouter automatiquement le dossier components s'il y a quelque chose dedans (mais on ne l'exporte pas forcément)
    # On peut aussi exporter le composant principal par défaut (le premier ou un placeholder) mais App.tsx n'en a pas besoin.
    # On crée simplement l'index avec les exports.
    create_file "$index_file" "// Auto-generated exports for feature \"$feature\"\n\n$exports"
done

# ============================================================
# INDEX GLOBAL DES FEATURES (optionnel)
# ============================================================

GLOBAL_EXPORTS=""
for feature in "${!FEATURE_EXPORTS[@]}"; do
    GLOBAL_EXPORTS+="export * from './$feature';\n"
done

create_file "$FEATURES_DIR/index.ts" "// Auto-generated global exports\n\n$GLOBAL_EXPORTS"

echo -e "${GREEN}🎉 Génération terminée !${NC}"
echo -e "${YELLOW}📌 Structure générée dans $FEATURES_DIR/${NC}"





const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
        toast.error('Formulaire incomplet', {
            description: 'Veuillez renseigner tous les champs obligatoires.',
        });
        return;
    }

    setIsSubmitting(true);
    try {
        const payload = { ...formData, montant: Number(formData.montant) } as CreatePaiementInput;
        const newPaiement = await create(payload);

        // Si aucune facture n'est associée, proposer d'en créer une
        if (!payload.factureId) {
            const shouldCreateInvoice = window.confirm(
                `Paiement enregistré (${newPaiement.montant.toLocaleString()} FCFA).\nSouhaitez-vous créer une facture pour ce paiement ?`
            );
            if (shouldCreateInvoice) {
                // Appeler une API pour créer une facture avec le montant du paiement
                // Par exemple : await createFacture({ candidatId: newPaiement.candidatId, montant: newPaiement.montant, paiementId: newPaiement.id });
                toast.info('Fonctionnalité de création de facture à implémenter');
            }
        }

        toast.success('Paiement enregistré avec succès', {
            description: `${newPaiement.montant.toLocaleString('fr-FR')} FCFA – ${newPaiement.mode}`,
        });
        navigate(PROTECTED_ROUTES.PAIEMENTS.DETAIL(newPaiement.id));
    } catch (err: any) {
        toast.error('Erreur lors de l’enregistrement', {
            description: err?.message ?? 'Une erreur inattendue est survenue.',
        });
    } finally {
        setIsSubmitting(false);
    }
}, [isFormValid, formData, create, navigate]);