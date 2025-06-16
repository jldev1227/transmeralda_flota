import React, { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import { SharedSelection } from "@heroui/system";

import FilterSection, { EstadoDocumentoOption } from "./filterSection";

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
  { key: "CAMION", label: "Camion" },
];

const categoriasDocumentos = [
  { key: "TARJETA_DE_PROPIEDAD", label: "Tarjeta de Propiedad" },
  { key: "SOAT", label: "SOAT" },
  { key: "TECNOMECANICA", label: "Tecnomecánica" },
  { key: "LICENCIA_TRANSITO", label: "Licencia de Tránsito" },
  { key: "REVISION_PREVENTIVA", label: "Revisión Preventiva" },
  { key: "POLIZA_CONTRACTUAL", label: "Póliza Contractual" },
  { key: "POLIZA_EXTRACONTRACTUAL", label: "Póliza Extracontractual" },
];

const estadosDocumentos: EstadoDocumentoOption[] = [
  { key: "VIGENTE", label: "Vigente", color: "success", icon: CheckCircle },
  { key: "VENCIDO", label: "Vencido", color: "danger", icon: AlertTriangle },
  {
    key: "POR_VENCER_30",
    label: "Vence en 30 días",
    color: "warning",
    icon: Clock,
  },
  {
    key: "POR_VENCER_15",
    label: "Vence en 15 días",
    color: "warning",
    icon: Clock,
  },
  {
    key: "POR_VENCER_7",
    label: "Vence en 7 días",
    color: "danger",
    icon: AlertTriangle,
  },
  {
    key: "SIN_DOCUMENTO",
    label: "Sin documento",
    color: "default",
    icon: FileText,
  },
];

const ordenamientoOpciones = [
  { key: "FECHA_VENCIMIENTO_ASC", label: "Fecha vencimiento (más próximo)" },
  { key: "FECHA_VENCIMIENTO_DESC", label: "Fecha vencimiento (más lejano)" },
  { key: "PLACA_ASC", label: "Placa (A-Z)" },
  { key: "PLACA_DESC", label: "Placa (Z-A)" },
  { key: "FECHA_CREACION_DESC", label: "Más recientes" },
  { key: "FECHA_CREACION_ASC", label: "Más antiguos" },
];

interface BuscadorFiltrosVehiculosProps {
  onSearch: (searchTerm: string) => void;
  onFilter: (filters: FilterOptions) => void;
  onReset: () => void;
}

export interface FilterOptions {
  estados: string[];
  clases: string[];
  categoriasDocumentos: string[];
  estadosDocumentos: string[];
  fechaVencimientoDesde?: string;
  fechaVencimientoHasta?: string;
  ordenamiento?: string;
  diasAlerta?: number;
}

interface FilterSets {
  estados: Set<string>;
  clases: Set<string>;
  categoriasDocumentos: Set<string>;
  estadosDocumentos: Set<string>;
}

const BuscadorFiltrosVehiculos: React.FC<BuscadorFiltrosVehiculosProps> = ({
  onSearch,
  onFilter,
  onReset,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filtros, setFiltros] = useState<FilterSets>({
    estados: new Set([]),
    clases: new Set([]),
    categoriasDocumentos: new Set([]),
    estadosDocumentos: new Set([]),
  });

  // Filtros adicionales para fechas y ordenamiento
  const [fechaVencimientoDesde, setFechaVencimientoDesde] =
    useState<string>("");
  const [fechaVencimientoHasta, setFechaVencimientoHasta] =
    useState<string>("");
  const [ordenamiento, setOrdenamiento] = useState<string>("");
  const [diasAlerta, setDiasAlerta] = useState<number | undefined>();

  // Mostrar panel avanzado
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    const filtrosArray: FilterOptions = {
      estados: Array.from(filtros.estados),
      clases: Array.from(filtros.clases),
      categoriasDocumentos: Array.from(filtros.categoriasDocumentos),
      estadosDocumentos: Array.from(filtros.estadosDocumentos),
      fechaVencimientoDesde: fechaVencimientoDesde || undefined,
      fechaVencimientoHasta: fechaVencimientoHasta || undefined,
      ordenamiento: ordenamiento || undefined,
      diasAlerta: diasAlerta || undefined,
    };

    onFilter(filtrosArray);
  }, [
    filtros,
    fechaVencimientoDesde,
    fechaVencimientoHasta,
    ordenamiento,
    diasAlerta,
  ]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const aplicarBusqueda = () => {
    onSearch(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      aplicarBusqueda();
    }
  };

  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltros({
      estados: new Set([]),
      clases: new Set([]),
      categoriasDocumentos: new Set([]),
      estadosDocumentos: new Set([]),
    });
    setFechaVencimientoDesde("");
    setFechaVencimientoHasta("");
    setOrdenamiento("");
    setDiasAlerta(undefined);
    onSearch("");
    onReset();
  };

  const contarFiltrosActivos = () => {
    let count =
      filtros.estados.size +
      filtros.clases.size +
      filtros.categoriasDocumentos.size +
      filtros.estadosDocumentos.size;

    if (fechaVencimientoDesde) count++;
    if (fechaVencimientoHasta) count++;
    if (ordenamiento) count++;
    if (diasAlerta) count++;

    return count;
  };

  // Filtros rápidos predefinidos
  const aplicarFiltroRapido = (tipo: string) => {
    switch (tipo) {
      case "DOCUMENTOS_VENCIDOS":
        setFiltros((prev) => ({
          ...prev,
          estadosDocumentos: new Set(["VENCIDO"]),
        }));
        break;
      case "VENCEN_PRONTO":
        setFiltros((prev) => ({
          ...prev,
          estadosDocumentos: new Set([
            "POR_VENCER_30",
            "POR_VENCER_15",
            "POR_VENCER_7",
          ]),
        }));
        break;
      case "SIN_DOCUMENTOS":
        setFiltros((prev) => ({
          ...prev,
          estadosDocumentos: new Set(["SIN_DOCUMENTO"]),
        }));
        break;
      case "SOLO_VIGENTES":
        setFiltros((prev) => ({
          ...prev,
          estadosDocumentos: new Set(["VIGENTE"]),
        }));
        break;
    }
  };

  const handleEstadosChange = (keys: SharedSelection) => {
    setFiltros((prev) => ({
      ...prev,
      estados: keys as unknown as Set<string>,
    }));
  };

  const handleClassesChange = (keys: SharedSelection) => {
    setFiltros((prev) => ({ ...prev, clases: keys as unknown as Set<string> }));
  };

  const handleCategoriasDocumentosChange = (keys: SharedSelection) => {
    setFiltros((prev) => ({
      ...prev,
      categoriasDocumentos: keys as unknown as Set<string>,
    }));
  };

  const handleEstadosDocumentosChange = (keys: SharedSelection) => {
    setFiltros((prev) => ({
      ...prev,
      estadosDocumentos: keys as unknown as Set<string>,
    }));
  };

  const renderFiltrosSeleccionados = () => {
    const todosLosFiltros = [
      ...Array.from(filtros.estados).map((estado) => ({
        tipo: "estados",
        valor: estado,
        label: `Estado: ${estado}`,
      })),
      ...Array.from(filtros.clases).map((clase) => ({
        tipo: "clases",
        valor: clase,
        label: `Clase: ${clase}`,
      })),
      ...Array.from(filtros.categoriasDocumentos).map((categoria) => {
        const cat = categoriasDocumentos.find((c) => c.key === categoria);

        return {
          tipo: "categoriasDocumentos",
          valor: categoria,
          label: `Documentos: ${cat?.label || categoria}`,
        };
      }),
      ...Array.from(filtros.estadosDocumentos).map((estado) => {
        const est = estadosDocumentos.find((e) => e.key === estado);

        return {
          tipo: "estadosDocumentos",
          valor: estado,
          label: `Estado documentos: ${est?.label || estado}`,
        };
      }),
    ];

    // Agregar filtros de fecha y otros
    if (fechaVencimientoDesde) {
      todosLosFiltros.push({
        tipo: "fechaDesde",
        valor: fechaVencimientoDesde,
        label: `Desde: ${fechaVencimientoDesde}`,
      });
    }
    if (fechaVencimientoHasta) {
      todosLosFiltros.push({
        tipo: "fechaHasta",
        valor: fechaVencimientoHasta,
        label: `Hasta: ${fechaVencimientoHasta}`,
      });
    }
    if (ordenamiento) {
      const ordenOp = ordenamientoOpciones.find((o) => o.key === ordenamiento);

      todosLosFiltros.push({
        tipo: "ordenamiento",
        valor: ordenamiento,
        label: `Orden: ${ordenOp?.label || ordenamiento}`,
      });
    }
    if (diasAlerta) {
      todosLosFiltros.push({
        tipo: "diasAlerta",
        valor: diasAlerta.toString(),
        label: `Alerta: ${diasAlerta} días`,
      });
    }

    if (todosLosFiltros.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {todosLosFiltros.map((filtro, index) => (
          <Chip
            key={`${filtro.tipo}-${index}`}
            color="primary"
            variant="flat"
            onClose={() => {
              if (filtro.tipo === "fechaDesde") {
                setFechaVencimientoDesde("");
              } else if (filtro.tipo === "fechaHasta") {
                setFechaVencimientoHasta("");
              } else if (filtro.tipo === "ordenamiento") {
                setOrdenamiento("");
              } else if (filtro.tipo === "diasAlerta") {
                setDiasAlerta(undefined);
              } else {
                const nuevosFiltros = { ...filtros };
                const newSet = new Set(
                  nuevosFiltros[filtro.tipo as keyof FilterSets],
                );

                newSet.delete(filtro.valor);
                setFiltros({
                  ...nuevosFiltros,
                  [filtro.tipo]: newSet,
                });
              }
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
      <div className="flex flex-col gap-4">
        <FilterSection
          // Estados y valores
          aplicarBusqueda={aplicarBusqueda}
          aplicarFiltroRapido={aplicarFiltroRapido}
          categoriasDocumentos={categoriasDocumentos}
          clases={clases}
          filtros={filtros}
          handleCategoriasDocumentosChange={handleCategoriasDocumentosChange}
          handleClassesChange={handleClassesChange}
          handleEstadosChange={handleEstadosChange}
          handleKeyPress={handleKeyPress}
          handleSearchChange={handleSearchChange}
          limpiarFiltros={limpiarFiltros}
          searchTerm={searchTerm}
          estadosDocumentos={estadosDocumentos}
          // Funciones de manejo de estado
          setSearchTerm={setSearchTerm}
          handleEstadosDocumentosChange={handleEstadosDocumentosChange}
          // Funciones utilitarias
          contarFiltrosActivos={contarFiltrosActivos}
          mostrarFiltrosAvanzados={mostrarFiltrosAvanzados}
          // Datos de opciones
          estados={estados}
          setMostrarFiltrosAvanzados={setMostrarFiltrosAvanzados}
          // Funciones de eventos
          onSearch={onSearch}
        />

        {/* Panel de filtros avanzados */}
        {mostrarFiltrosAvanzados && (
          <div className="border-t pt-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fecha desde */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="dateFrom"
                >
                  Vencimiento desde
                </label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={fechaVencimientoDesde}
                  onChange={(e) => setFechaVencimientoDesde(e.target.value)}
                />
              </div>

              {/* Fecha hasta */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="dateTo"
                >
                  Vencimiento hasta
                </label>
                <Input
                  id="dateTo"
                  type="date"
                  value={fechaVencimientoHasta}
                  onChange={(e) => setFechaVencimientoHasta(e.target.value)}
                />
              </div>

              {/* Días de alerta */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="daysAlert"
                >
                  Días de alerta
                </label>
                <Input
                  id="daysAlert"
                  placeholder="ej: 30"
                  type="number"
                  value={diasAlerta?.toString() || ""}
                  onChange={(e) =>
                    setDiasAlerta(
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                />
              </div>

              {/* Ordenamiento */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="orderBy"
                >
                  Ordenar por
                </label>
                <Select
                  id="orderBy"
                  placeholder="Seleccionar orden"
                  value={ordenamiento}
                  onChange={(e) => setOrdenamiento(e.target.value)}
                >
                  {ordenamientoOpciones.map((opcion) => (
                    <SelectItem key={opcion.key} textValue={opcion.key}>
                      {opcion.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Filtros seleccionados */}
        {renderFiltrosSeleccionados()}
      </div>
    </div>
  );
};

export default BuscadorFiltrosVehiculos;
