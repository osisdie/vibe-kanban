import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import client from '../api/client';
import KanbanColumn from './KanbanColumn';
import TicketModal from './TicketModal';
import { COLUMNS, type TicketBrief, type TicketStatus } from '../types';

interface Props {
  apiKeyId: number;
}

export default function KanbanBoard({ apiKeyId }: Props) {
  const [tickets, setTickets] = useState<TicketBrief[]>([]);
  const [modalTicketId, setModalTicketId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [createInStatus, setCreateInStatus] = useState<TicketStatus>('todo');

  const fetchTickets = useCallback(async () => {
    const { data } = await client.get(`/api-keys/${apiKeyId}/tickets`);
    setTickets(data);
  }, [apiKeyId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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
