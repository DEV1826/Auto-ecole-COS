import { useCallback, useState } from 'react';
import { useAppointmentStore } from '@/store';
import { appointmentService } from '@/services';
import { Appointment } from '@/types/models';
import type { AppointmentFilters, CreateAppointmentData, UpdateAppointmentData } from '@/types/Dto';

export const useAppointments = () => {
  const store = useAppointmentStore();
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(
    async (filters?: AppointmentFilters) => {
      store.setIsLoading(true);
      try {
        const appointments = await appointmentService.getAll(filters);
        store.setAppointments(appointments);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
      } finally {
        store.setIsLoading(false);
      }
    },
    [store]
  );

  const createAppointment = useCallback(
    async (data: CreateAppointmentData) => {
      store.setIsLoading(true);
      try {
        const appointment = await appointmentService.create(data);
        store.addAppointment(appointment);
        setError(null);
        return appointment;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create appointment');
        throw err;
      } finally {
        store.setIsLoading(false);
      }
    },
    [store]
  );

  const updateAppointment = useCallback(
    async (id: string, data: UpdateAppointmentData) => {
      store.setIsLoading(true);
      try {
        const appointment = await appointmentService.update(id, data);
        store.updateAppointment(appointment);
        setError(null);
        return appointment;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update appointment');
        throw err;
      } finally {
        store.setIsLoading(false);
      }
    },
    [store]
  );

  const deleteAppointment = useCallback(
    async (id: string) => {
      store.setIsLoading(true);
      try {
        await appointmentService.delete(id);
        store.deleteAppointment(id);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete appointment');
        throw err;
      } finally {
        store.setIsLoading(false);
      }
    },
    [store]
  );

  return {
    appointments: store.appointments,
    selectedAppointment: store.selectedAppointment,
    isLoading: store.isLoading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    setSelectedAppointment: store.setSelectedAppointment,
  };
};
