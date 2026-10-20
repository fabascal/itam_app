import type { TicketLevel, TicketPriority, TicketStatus } from '../api/types';

export const ticketStatusLabel: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En proceso',
  PROVIDER: 'Proveedor',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

export const ticketPriorityLabel: Record<TicketPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const ticketLevelLabel: Record<TicketLevel, string> = {
  LEVEL_1: 'Nivel 1',
  LEVEL_2: 'Nivel 2',
  PROVEEDOR: 'Proveedor',
};

export function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
