import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import client from '../api/client';
import KanbanColumn from './KanbanColumn';
import TicketModal from './TicketModal';
import { COLUMNS, type TicketBrief, type TicketStatus } from '../types';

const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '20s', value: 20000 },
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 },
];

const STORAGE_KEY = 'kanban-refresh-interval';

interface Props {
  apiKeyId: number;
}

export default function KanbanBoard({ apiKeyId }: Props) {
  const [tickets, setTickets] = useState<TicketBrief[]>([]);
  const [modalTicketId, setModalTicketId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [createInStatus, setCreateInStatus] = useState<TicketStatus>('todo');
  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 0;
  });

  const fetchTickets = useCallback(async () => {
    const { data } = await client.get(`/api-keys/${apiKeyId}/tickets`);
    setTickets(data);
  }, [apiKeyId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (refreshInterval <= 0) return;
    const id = setInterval(fetchTickets, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, fetchTickets]);

  const handleRefreshChange = (value: number) => {
    setRefreshInterval(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const ticketId = parseInt(draggableId);
    const newStatus = destination.droppableId as TicketStatus;
    const newOrder = destination.index;

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus, order: newOrder } : t))
    );

    try {
      await client.patch(`/tickets/${ticketId}/move`, { status: newStatus, order: newOrder });
      fetchTickets(); // re-fetch for correct ordering
    } catch {
      fetchTickets(); // rollback
    }
  };

  const openCreate = (status: TicketStatus) => {
    setModalTicketId(null);
    setCreateInStatus(status);
    setShowModal(true);
  };

  const openEdit = (id: number) => {
    setModalTicketId(id);
    setShowModal(true);
  };

  const grouped = COLUMNS.map((col) => ({
    ...col,
    tickets: tickets
      .filter((t) => t.status === col.key)
      .sort((a, b) => a.order - b.order),
  }));

  return (
    <>
      <div className="flex items-center justify-end px-4 pt-2">
        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          Auto-refresh:
          <select
            value={refreshInterval}
            onChange={(e) => handleRefreshChange(Number(e.target.value))}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-gray-300"
          >
            {REFRESH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-4 min-h-[calc(100vh-80px)]">
          {grouped.map((col) => (
            <KanbanColumn
              key={col.key}
              status={col.key}
              label={col.label}
              color={col.color}
              tickets={col.tickets}
              onTicketClick={openEdit}
              onAddClick={() => openCreate(col.key)}
            />
          ))}
        </div>
      </DragDropContext>

      {showModal && (
        <TicketModal
          ticketId={modalTicketId}
          apiKeyId={apiKeyId}
          onClose={() => setShowModal(false)}
          onSaved={fetchTickets}
          createInStatus={createInStatus}
        />
      )}
    </>
  );
}
