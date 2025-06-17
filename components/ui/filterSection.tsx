import React from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import {
  Search,
  X,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ChevronDown,
  LucideProps,
} from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { SharedSelection } from "@heroui/system";

interface EstadoOption {
  key: string;
  label: string;
}

interface ClaseOption {
  key: string;
  label: string;
}

interface CategoriaDocumentoOption {
  key: string;
  label: string;
}

export interface EstadoDocumentoOption {
  key: string;
  label: string;
  color: "success" | "danger" | "warning" | "default";
  icon: React.ComponentType<LucideProps>; // ✅ Usa LucideProps
}

interface FilterSets {
  estados: Set<string>;
  clases: Set<string>;
  categoriasDocumentos: Set<string>;
  estadosDocumentos: Set<string>;
}

interface FilterSectionProps {
  // Estados de input y filtros
  searchTerm: string;
  filtros: FilterSets;
  mostrarFiltrosAvanzados: boolean;

  // Datos de opciones para dropdowns
  estados: EstadoOption[];
  clases: ClaseOption[];
  categoriasDocumentos: CategoriaDocumentoOption[];
  estadosDocumentos: EstadoDocumentoOption[];

  // Setters para estados
  setSearchTerm: (value: string) => void;
  setMostrarFiltrosAvanzados: (value: boolean) => void;

  // Event handlers para input de búsqueda
  onSearch: (searchTerm: string) => void;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  aplicarBusqueda: () => void;

  // Event handlers para filtros
  aplicarFiltroRapido: (
    tipo:
      | "DOCUMENTOS_VENCIDOS"
      | "VENCEN_PRONTO"
      | "SIN_DOCUMENTOS"
      | "SOLO_VIGENTES",
  ) => void;
  handleEstadosChange: (keys: SharedSelection) => void;
  handleClassesChange: (keys: SharedSelection) => void;
  handleCategoriasDocumentosChange: (keys: SharedSelection) => void;
  handleEstadosDocumentosChange: (keys: SharedSelection) => void;

  // Utility functions
  contarFiltrosActivos: () => number;
  limpiarFiltros: () => void;
}

const FilterSection = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  filtros,
  estados,
  clases,
  categoriasDocumentos,
  estadosDocumentos,
  handleSearchChange,
  handleKeyPress,
  aplicarBusqueda,
  aplicarFiltroRapido,
  handleEstadosChange,
  handleClassesChange,
  handleCategoriasDocumentosChange,
  handleEstadosDocumentosChange,
  setMostrarFiltrosAvanzados,
  mostrarFiltrosAvanzados,
  contarFiltrosActivos,
  limpiarFiltros,
}: FilterSectionProps) => {
  return (
    <div className="p-4 space-y-4">
      {/* Buscador Principal en una fila completa */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        <div className="flex-1">
          <Input
            className="w-full"
            endContent={
              searchTerm && (
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => {
                    setSearchTerm("");
                    onSearch("");
                  }}
                >
                  <X size={16} />
                </button>
              )
            }
            placeholder="Buscar por placa, marca, modelo, línea o propietario..."
            radius="md"
            size="md"
            startContent={<Search className="text-gray-400" size={18} />}
            type="text"
            value={searchTerm}
            variant="flat"
            onChange={handleSearchChange}
            onKeyDown={handleKeyPress}
          />
        </div>
        <Button
          fullWidth
          className="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
          radius="md"
          size="md"
          startContent={<Search size={16} />}
          variant="solid"
          onPress={aplicarBusqueda}
        >
          Buscar
        </Button>
      </div>

      {/* Filtros Compactos */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          {/* Filtros Rápidos */}
          <Button
            className="w-full sm:w-auto justify-start text-xs"
            color="danger"
            radius="md"
            size="sm"
            startContent={<AlertTriangle size={14} />}
            variant="flat"
            onPress={() => aplicarFiltroRapido("DOCUMENTOS_VENCIDOS")}
          >
            Vencidos
          </Button>
          <Button
            className="w-full sm:w-auto justify-start text-xs"
            color="warning"
            radius="md"
            size="sm"
            startContent={<Clock size={14} />}
            variant="flat"
            onPress={() => aplicarFiltroRapido("VENCEN_PRONTO")}
          >
            Por Vencer
          </Button>
          <Button
            className="w-full sm:w-auto justify-start text-xs"
            color="default"
            radius="md"
            size="sm"
            startContent={<FileText size={14} />}
            variant="flat"
            onPress={() => aplicarFiltroRapido("SIN_DOCUMENTOS")}
          >
            Sin Documentos
          </Button>
          <Button
            className="w-full sm:w-auto justify-start text-xs"
            color="success"
            radius="md"
            size="sm"
            startContent={<CheckCircle size={14} />}
            variant="flat"
            onPress={() => aplicarFiltroRapido("SOLO_VIGENTES")}
          >
            Vigentes
          </Button>

          {/* Dropdown Estados */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                className="justify-between min-w-[90px]"
                color="primary"
                endContent={<ChevronDown size={14} />}
                radius="md"
                size="sm"
                variant="flat"
              >
                <span className="text-xs truncate">
                  Estados
                  {filtros.estados.size > 0 && ` (${filtros.estados.size})`}
                </span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Estados de vehículos"
              className="min-w-[180px]"
              closeOnSelect={false}
              selectedKeys={filtros.estados}
              selectionMode="multiple"
              onSelectionChange={handleEstadosChange}
            >
              {estados.map((estado) => (
                <DropdownItem key={estado.key}>{estado.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Dropdown Clases */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                className="justify-between min-w-[85px]"
                color="primary"
                endContent={<ChevronDown size={14} />}
                radius="md"
                size="sm"
                variant="flat"
              >
                <span className="text-xs truncate">
                  Clases{filtros.clases.size > 0 && ` (${filtros.clases.size})`}
                </span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Clases de vehículos"
              className="min-w-[180px]"
              closeOnSelect={false}
              selectedKeys={filtros.clases}
              selectionMode="multiple"
              onSelectionChange={handleClassesChange}
            >
              {clases.map((clase) => (
                <DropdownItem key={clase.key}>{clase.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Dropdown Categorías de Documentos */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                className="justify-between min-w-[75px]"
                color="secondary"
                endContent={<ChevronDown size={14} />}
                radius="md"
                size="sm"
                variant="flat"
              >
                <span className="text-xs truncate">
                  Documentos
                  {filtros.categoriasDocumentos.size > 0 &&
                    ` (${filtros.categoriasDocumentos.size})`}
                </span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Categorías de documentos"
              className="min-w-[220px]"
              closeOnSelect={false}
              selectedKeys={filtros.categoriasDocumentos}
              selectionMode="multiple"
              onSelectionChange={handleCategoriasDocumentosChange}
            >
              {categoriasDocumentos.map((categoria) => (
                <DropdownItem key={categoria.key}>
                  {categoria.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Dropdown Estados de Documentos */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                className="justify-between min-w-[80px]"
                color="secondary"
                endContent={<ChevronDown size={14} />}
                radius="md"
                size="sm"
                variant="flat"
              >
                <span className="text-xs truncate">
                  Estado documentación
                  {filtros.estadosDocumentos.size > 0 &&
                    ` (${filtros.estadosDocumentos.size})`}
                </span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Estados de documentos"
              className="min-w-[180px]"
              closeOnSelect={false}
              selectedKeys={filtros.estadosDocumentos}
              selectionMode="multiple"
              onSelectionChange={handleEstadosDocumentosChange}
            >
              {estadosDocumentos.map((estado) => (
                <DropdownItem
                  key={estado.key}
                  startContent={<estado.icon size={14} />}
                >
                  {estado.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Botón filtros avanzados */}
          <Button
            className="justify-center min-w-[90px]"
            color="default"
            radius="md"
            size="sm"
            startContent={<Calendar size={14} />}
            variant="flat"
            onPress={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
          >
            <span className="text-xs">Avanzados</span>
          </Button>

          {/* Botón limpiar */}
          {contarFiltrosActivos() > 0 && (
            <Button
              className="justify-center min-w-[80px]"
              color="danger"
              radius="md"
              size="sm"
              startContent={<RefreshCw size={14} />}
              variant="flat"
              onPress={limpiarFiltros}
            >
              <span className="text-xs">
                Limpiar ({contarFiltrosActivos()})
              </span>
            </Button>
          )}
        </div>

        {/* Indicador de filtros activos - más compacto */}
        {contarFiltrosActivos() > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded-md">
            <div className="h-1.5 w-1.5 bg-primary-500 rounded-full animate-pulse" />
            <span>
              {contarFiltrosActivos()} filtro
              {contarFiltrosActivos() > 1 ? "s" : ""} activo
              {contarFiltrosActivos() > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSection;
