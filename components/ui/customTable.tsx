import React, { useEffect, useState } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

import { useFlota, Vehiculo } from "@/context/FlotaContext";

export type SortDescriptor = {
  column: string;
  direction: "ascending" | "descending";
};

export interface Column {
  key: string;
  label: string;
  allowsSorting?: boolean;
  renderCell: (
    item: any,
    options?: {
      selectedItems?: any[];
      onSelectionChange?: (item: any) => void;
      getItemId?: (item: any) => string;
      selected?: boolean;
      onSelect?: (item: any, selected: boolean) => void;
    },
  ) => React.ReactNode;
}

interface RowAnimationState {
  [key: string]: {
    isNew: boolean;
    isUpdated: boolean;
    eventType: string;
    timestamp: number;
  };
}

interface CustomTableProps {
  columns: Column[];
  data: any[];
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  emptyContent?: React.ReactNode;
  loadingContent?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  onRowClick?: (item: any) => void;
  selectedItems?: any[];
  onSelectionChange?: (item: any) => void;
  getItemId?: (item: any) => string;
  onSelectAll?: (selected: boolean, currentItems?: Vehiculo[]) => void;
}

const CustomTable: React.FC<CustomTableProps> = ({
  columns,
  data,
  sortDescriptor,
  onSortChange,
  emptyContent = "No hay datos disponibles",
  loadingContent,
  isLoading = false,
  className = "",
  onRowClick,
  selectedItems,
  onSelectionChange,
  getItemId,
  onSelectAll,
}) => {
  const { socketConnected, socketEventLogs } = useFlota();

  const [rowAnimations, setRowAnimations] = useState<RowAnimationState>({});

  // Manejar cambio de ordenamiento
  const handleSort = (column: string) => {
    if (
      !onSortChange ||
      !columns.find((col) => col.key === column)?.allowsSorting
    )
      return;

    let direction: "ascending" | "descending" = "ascending";

    if (sortDescriptor?.column === column) {
      direction =
        sortDescriptor.direction === "ascending" ? "descending" : "ascending";
    }

    onSortChange({ column, direction });
  };

  // Actualiza el useEffect donde procesas los eventos de socket
  useEffect(() => {
    if (!socketEventLogs || socketEventLogs.length === 0) return;

    // Obtener el evento más reciente
    const latestEvents = [...socketEventLogs]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5); // Solo procesar los 5 eventos más recientes

    const now = Date.now();
    const newAnimations: RowAnimationState = { ...rowAnimations };

    latestEvents.forEach((event) => {
      // Obtener ID del vehiculo según el tipo de evento
      let vehiculoId = "";

      if (event.data.vehiculo) {
        vehiculoId = event.data.vehiculo.id;
      } else if (event.data.id) {
        vehiculoId = event.data.id;
      }

      if (!vehiculoId) return;

      if (event.eventName === "vehiculo:creado") {
        newAnimations[vehiculoId] = {
          isNew: true,
          isUpdated: false,
          eventType: event.eventName,
          timestamp: now,
        };
      } else if (event.eventName === "vehiculo:actualizado") {
        // Para cualquier otro evento, marcar como actualizado
        newAnimations[vehiculoId] = {
          isNew: false,
          isUpdated: true,
          eventType: event.eventName,
          timestamp: now,
        };
      }

      // Scroll al vehiculo si es nuevo
      if (event.eventName === "vehiculo:creado") {
        setTimeout(() => {
          const row = document.getElementById(`vehiculo-row-${vehiculoId}`);

          if (row) {
            row.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    });

    setRowAnimations(newAnimations);

    // Limpiar animaciones después de 5 segundos
    const timer = setTimeout(() => {
      setRowAnimations((prev) => {
        const updated: RowAnimationState = {};

        // Solo mantener animaciones que sean más recientes que 5 segundos
        Object.entries(prev).forEach(([id, state]) => {
          if (now - state.timestamp < 5000) {
            updated[id] = state;
          }
        });

        return updated;
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [socketEventLogs]);

  return (
    <div className={`overflow-x-auto ${className}`}>
      {/* Indicador de conexión en tiempo real */}
      {socketConnected && (
        <div className="px-6 py-2 bg-green-50 text-green-700 border-b border-green-100 flex items-center text-sm">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
          <span>Sincronización en tiempo real activa</span>
        </div>
      )}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => {
              // Si es la columna de selección, renderizar checkbox de "seleccionar todos"
              if (column.key === "select") {
                // Obtener IDs de la página actual
                const currentPageIds = data.map(
                  (item) => getItemId?.(item) || item.id,
                );

                // Obtener IDs seleccionados (desde el componente padre via selectedItems o prop separada)
                const selectedIds = selectedItems
                  ? selectedItems.map((item) => getItemId?.(item) || item.id)
                  : [];

                // Verificar si todos los elementos de la página actual están seleccionados
                const allCurrentPageSelected =
                  data.length > 0 &&
                  currentPageIds.every((id) => selectedIds.includes(id));

                const handleSelectAllToggle = () => {
                  if (onSelectAll) {
                    onSelectAll(!allCurrentPageSelected);
                  }
                };

                return (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    scope="col"
                  >
                    <input
                      aria-label="Seleccionar todos"
                      checked={allCurrentPageSelected || false}
                      className="accent-emerald-600 h-4 w-4 rounded border-gray-300"
                      type="checkbox"
                      onChange={handleSelectAllToggle}
                    />
                  </th>
                );
              }

              // Para todas las demás columnas, usar el comportamiento normal
              return (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.allowsSorting
                      ? "cursor-pointer hover:bg-gray-100"
                      : ""
                  }`}
                  scope="col"
                  onClick={() => column.allowsSorting && handleSort(column.key)}
                >
                  <div className="flex flex-row items-center space-x-1">
                    <span>{column.label}</span>
                    {column.allowsSorting &&
                      sortDescriptor?.column === column.key &&
                      (sortDescriptor.direction === "ascending" ? (
                        <ArrowUpIcon className="h-4 w-4 ml-2" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 ml-2" />
                      ))}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td
                className="px-6 py-4 whitespace-nowrap"
                colSpan={columns.length}
              >
                {loadingContent}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                className="px-6 py-4 whitespace-nowrap"
                colSpan={columns.length}
              >
                {emptyContent}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => {
              const vehiculoId = item.id || "";
              const animation = rowAnimations[vehiculoId];

              const isNew = animation?.isNew || false;
              const isUpdated = animation?.isUpdated || false;

              // Verificar si el item está seleccionado
              const isSelected = selectedItems
                ? selectedItems.some(
                    (selected) =>
                      (getItemId?.(selected) || selected.id) ===
                      (getItemId?.(item) || item.id),
                  )
                : false;

              const handleSelect = (item: any, selected: boolean) => {
                onSelectionChange?.(item);
              };

              return (
                <tr
                  key={item.id ?? rowIndex}
                  aria-label={`Fila de ${item.id ?? rowIndex}`}
                  className={`
                    hover:bg-gray-50 transition-colors cursor-pointer
                    ${isNew ? "animate-pulse bg-success-50" : ""}
                    ${isUpdated && !isNew ? "animate-pulse bg-primary-50" : ""}
                  `}
                  id={`vehiculo-row-${item.id ?? rowIndex}`}
                  tabIndex={0}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {column.renderCell
                        ? column.renderCell(item, {
                            selectedItems,
                            onSelectionChange,
                            getItemId,
                            selected: isSelected,
                            onSelect: handleSelect,
                          })
                        : item[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomTable;
