import React, { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Search, X, RefreshCw } from "lucide-react";
import { SharedSelection } from "@heroui/system";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

const estados = [
  { key: "DISPONIBLE", label: "Disponible" },
  { key: "NO DISPONIBLE", label: "No disponible" },
  { key: "MANTENIMIENTO", label: "Mantenimiento" },
  { key: "INACTIVO", label: "Inactivo" },
];

const clases = [
  { key: "CAMIONETA", label: "Camioneta" },
  { key: "BUS", label: "Bus" },
  { key: "BUSETA", label: "Buseta" },
  { key: "MICROBUS", label: "Microbus" },
  { key: "CAMION", label: "Camion" }
];

interface BuscadorFiltrosConductoresProps {
  onSearch: (searchTerm: string) => void;
  onFilter: (filters: FilterOptions) => void;
  onReset: () => void;
}

export interface FilterOptions {
  estados: string[];
  clases: string[];
}

// Definir tipos para los Sets
interface FilterSets {
  estados: Set<string>;
  clases: Set<string>;
}

const BuscadorFiltrosConductores: React.FC<BuscadorFiltrosConductoresProps> = ({
  onSearch,
  onFilter,
  onReset,
}) => {
  // Estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Estado para los filtros como Sets
  const [filtros, setFiltros] = useState<FilterSets>({
    estados: new Set([]),
    clases: new Set([]),
  });

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    // Convertir los Sets a arrays para pasarlos a onFilter
    const filtrosArray: FilterOptions = {
      estados: Array.from(filtros.estados),
      clases: Array.from(filtros.clases)
    };

    onFilter(filtrosArray);
  }, [filtros]);

  // Manejar cambio en el término de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Aplicar búsqueda al presionar Enter o el botón
  const aplicarBusqueda = () => {
    if (searchTerm === "") return
    onSearch(searchTerm);
  };

  // Manejar tecla Enter en el campo de búsqueda
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      aplicarBusqueda();
    }
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltros({
      estados: new Set([]),
      clases: new Set([])
    });
    onSearch("");
    onReset();
  };

  // Contar filtros activos
  const contarFiltrosActivos = () => {
    return (
      filtros.estados.size
    );
  };

  const handleEstadosChange = (keys: SharedSelection) => {
    setFiltros((prev) => ({
      ...prev,
      estados: keys as unknown as Set<string>,
    }));
  };

  // Renderizar tags de filtros seleccionados
  const renderFiltrosSeleccionados = () => {
    const todosLosFiltros = [
      ...Array.from(filtros.estados).map((estado) => ({
        tipo: "estados",
        valor: estado,
        label: `Estado: ${estado}`,
      })),
    ];

    if (todosLosFiltros.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-5">
        {todosLosFiltros.map((filtro, index) => (
          <Chip
            key={`${filtro.tipo}-${index}`}
            color="primary"
            variant="flat"
            onClose={() => {
              const nuevosFiltros = { ...filtros };
              const newSet = new Set(
                nuevosFiltros[filtro.tipo as keyof FilterSets],
              );

              newSet.delete(filtro.valor);
              setFiltros({
                ...nuevosFiltros,
                [filtro.tipo]: newSet,
              });
            }}
          >
            {filtro.label}
          </Chip>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Buscador */}
        <div className="flex-grow">
          <Input
            className="w-full"
            endContent={
              searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    onSearch("");
                  }}
                >
                  <X className="text-gray-400" size={18} />
                </button>
              )
            }
            placeholder="Buscar por placa, marca, modelo o línea..."
            startContent={<Search className="text-gray-400" size={18} />}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyPress}
          />
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <Button
            className="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
            variant="solid"
            onPress={aplicarBusqueda}
          >
            Buscar
          </Button>

          {/* Dropdown para estados */}
          <Dropdown>
            <DropdownTrigger>
              <Button color="primary" radius="sm" variant="flat">
                Estados{" "}
                {filtros.estados.size > 0 &&
                  `(${filtros.estados.size})`}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Tipos de estados"
              closeOnSelect={false}
              selectedKeys={filtros.estados}
              selectionMode="multiple"
              onSelectionChange={handleEstadosChange}
            >
              {estados.map((tipo) => (
                <DropdownItem key={tipo.key}>{tipo.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

           {/* Dropdown para clase vehiculo */}
          <Dropdown>
            <DropdownTrigger>
              <Button color="primary" radius="sm" variant="flat">
                Clase{" "}
                {filtros.clases.size > 0 &&
                  `(${filtros.clases.size})`}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Tipos de clases"
              closeOnSelect={false}
              selectedKeys={filtros.clases}
              selectionMode="multiple"
              onSelectionChange={handleEstadosChange}
            >
              {clases.map((tipo) => (
                <DropdownItem key={tipo.key}>{tipo.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Botón para limpiar todos los filtros */}
          {contarFiltrosActivos() > 0 && (
            <Button
              color="danger"
              radius="sm"
              startContent={<RefreshCw size={18} />}
              variant="flat"
              onPress={limpiarFiltros}
            >
              Limpiar filtros ({contarFiltrosActivos()})
            </Button>
          )}
        </div>
      </div>
      {renderFiltrosSeleccionados()}
    </div>
  );
};

export default BuscadorFiltrosConductores;
