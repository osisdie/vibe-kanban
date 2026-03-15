import { Draggable } from '@hello-pangea/dnd';
import type { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import type { TicketBrief } from '../types';

const priorityColors = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
};

interface Props {
  ticket: TicketBrief;
  index: number;
  onClick: () => void;
}

export default function TicketCard({ ticket, index, onClick }: Props) {
  return (
    <Draggable draggableId={String(ticket.id)} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${
            priorityColors[ticket.priority]
          } p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''
          }`}
        >
          <p className="text-sm font-medium text-gray-800 leading-snug">{ticket.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                ticket.priority === 'high'
                  ? 'bg-red-100 text-red-700'
                  : ticket.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {ticket.priority}
            </span>
            {ticket.external_ref && (
              <span className="text-xs text-gray-400 truncate max-w-[100px]">
                {ticket.external_ref}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
