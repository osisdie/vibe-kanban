import { Droppable } from '@hello-pangea/dnd';
import TicketCard from './TicketCard';
import type { TicketBrief, TicketStatus } from '../types';

interface Props {
  status: TicketStatus;
  label: string;
  color: string;
  tickets: TicketBrief[];
  onTicketClick: (id: number) => void;
  onAddClick: () => void;
}

export default function KanbanColumn({ status, label, color, tickets, onTicketClick, onAddClick }: Props) {
  return (
    <div className={`${color} rounded-xl p-3 min-w-[220px] flex-1 flex flex-col`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {label}
          <span className="ml-2 text-xs font-normal text-gray-400">{tickets.length}</span>
        </h3>
        <button
          onClick={onAddClick}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          title="Add ticket"
        >
          +
        </button>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[100px] rounded-lg transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-100/50' : ''
            }`}
          >
            {tickets.map((t, i) => (
              <TicketCard key={t.id} ticket={t} index={i} onClick={() => onTicketClick(t.id)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
