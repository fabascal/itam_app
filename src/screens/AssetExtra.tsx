import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AssetDocument, Ticket } from '../api/types';
import { isApiError, useSession } from '../auth/session';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { formatDate } from '../utils/date';
import {
  formatBytes,
  ticketLevelLabel,
  ticketPriorityLabel,
  ticketStatusLabel,
} from '../utils/labels';

export function TicketsPane({ assetId }: { assetId: number }) {
  const { colors } = useTheme();
  const { api, deny } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.tickets(assetId);
      setTickets(result.tickets);
    } catch (caught) {
      if (isApiError(caught) && caught.status === 403) {
        deny();
        return;
      }
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    } finally {
      setLoading(false);
    }
  }, [api, assetId, deny]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (tickets.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
        Sin tickets
      </Text>
    );
  }
  return (
    <View style={styles.list}>
      {tickets.map(ticket => (
        <View
          key={ticket.id}
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceLowest,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{ticket.title}</Text>
          <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
            {ticketStatusLabel[ticket.status]} · {ticketPriorityLabel[ticket.priority]} ·{' '}
            {ticketLevelLabel[ticket.level]}
          </Text>
          {ticket.description ? (
            <Text style={[styles.body, { color: colors.onSurface }]}>{ticket.description}</Text>
          ) : null}
          {ticket.assignedTo ? (
            <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
              {ticket.assignedTo.fullName}
            </Text>
          ) : null}
          <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
            {formatDate(ticket.createdAt)}
          </Text>
          {ticket.events.map(event => (
            <Text key={event.id} style={[styles.meta, { color: colors.onSurfaceVariant }]}>
              {event.action}
              {event.actor ? ` · ${event.actor.fullName}` : ''}
              {formatDate(event.createdAt) ? ` · ${formatDate(event.createdAt)}` : ''}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function DocumentsPane({ assetId }: { assetId: number }) {
  const { colors } = useTheme();
  const { api, deny } = useSession();
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.documents(assetId);
      setDocuments(result.documents);
    } catch (caught) {
      if (isApiError(caught) && caught.status === 403) {
        deny();
        return;
      }
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    } finally {
      setLoading(false);
    }
  }, [api, assetId, deny]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function open(doc: AssetDocument) {
    try {
      await api.downloadDocument(assetId, doc);
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    }
  }

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (documents.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
        Sin documentos
      </Text>
    );
  }
  return (
    <View style={styles.list}>
      {documents.map(doc => (
        <Pressable
          key={doc.id}
          onPress={() => open(doc).catch(() => undefined)}
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceLowest,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{doc.originalName}</Text>
          <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
            {formatBytes(doc.sizeBytes)}
            {doc.assignedToName ? ` · ${doc.assignedToName}` : ''}
            {formatDate(doc.assignedToDate) ? ` · ${formatDate(doc.assignedToDate)}` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  title: { fontFamily: font.semibold, fontSize: 16 },
  body: { fontFamily: font.regular, fontSize: 14 },
  meta: { fontFamily: font.medium, fontSize: 12 },
  empty: { fontFamily: font.regular, fontSize: 14, paddingVertical: 12 },
});
