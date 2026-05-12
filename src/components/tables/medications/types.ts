// ─────────────────────────────────────────────────────────────────────────────
// Configuration des colonnes des tableaux
// ─────────────────────────────────────────────────────────────────────────────

import type { MedicationDTO, MedicationReminderDTO } from '@/types/Dto/medication.dto';

/**
 * @interface MedicationColumnConfig
 * @description Contrôle la visibilité des colonnes dans le tableau des médicaments.
 */
export interface MedicationColumnConfig {
  showPhoto?: boolean;
  showName?: boolean;
  showActiveIngredient?: boolean;
  showDosage?: boolean;
  showCategory?: boolean;
  showManufacturer?: boolean;
  showPrice?: boolean;
  showStock?: boolean;
  showExpiry?: boolean;
  showPrescriptionRequired?: boolean;
  showStatus?: boolean;
  showActions?: boolean;
}

/**
 * @interface ReminderColumnConfig
 * @description Contrôle la visibilité des colonnes dans le tableau des rappels.
 */
export interface ReminderColumnConfig {
  showPatient?: boolean;
  showMedication?: boolean;
  showDosage?: boolean;
  showRemindAt?: boolean;
  showStatus?: boolean;
  showActions?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions des tableaux
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface MedicationTableActions
 * @description Callbacks d'actions sur les lignes du tableau des médicaments.
 */
export interface MedicationTableActions {
  onView?: (medication: MedicationDTO) => void;
  onEdit?: (medication: MedicationDTO) => void;
  onDelete?: (medication: MedicationDTO) => Promise<void>;
  onUpdateStock?: (medication: MedicationDTO) => void;
  onViewPrescriptions?: (medication: MedicationDTO) => void;
}

/**
 * @interface ReminderTableActions
 * @description Callbacks d'actions sur les lignes du tableau des rappels.
 */
export interface ReminderTableActions {
  onView?: (reminder: MedicationReminderDTO) => void;
  onMarkTaken?: (reminder: MedicationReminderDTO) => Promise<void>;
  onSnooze?: (reminder: MedicationReminderDTO, minutes?: number) => Promise<void>;
  onSkip?: (reminder: MedicationReminderDTO) => Promise<void>;
  onEdit?: (reminder: MedicationReminderDTO) => void;
}
