import { useEffect, useRef, useState } from "react";
import { TruckIcon, ChevronLeftIcon, ChevronRightIcon, Trash2, Edit, Eye } from "lucide-react";
import { useFlota, Vehiculo } from "@/context/FlotaContext";

// Función para obtener todos los documentos clasificados
const getDocumentStatus = (vehicle: Vehiculo) => {
    // Definir todos los documentos requeridos
    const requiredDocs = [
        { name: "SOAT", date: vehicle.soatVencimiento },
        { name: "Técnicomecánica", date: vehicle.tecnomecanicaVencimiento },
        {
            name: "Tarjeta de Operación",
            date: vehicle.tarjetaDeOperacionVencimiento,
        },
        { name: "Póliza Contractual", date: vehicle.polizaContractualVencimiento },
        {
            name: "Póliza Extracontractual",
            date: vehicle.polizaExtraContractualVencimiento,
        },
        { name: "Póliza Todo Riesgo", date: vehicle.polizaTodoRiesgoVencimiento },
    ];

    // Todos los documentos con su estado
    const allDocs = requiredDocs.map((doc) => ({
        ...doc,
        status: doc.date ? checkDocumentStatus(doc.date) : "NA",
        date: doc.date ? new Date(doc.date) : null,
    }));

    // Separar por estado
    const pendientes = allDocs.filter((doc) => doc.status === "NA");
    const vencidos = allDocs.filter((doc) => doc.status === "VENCIDO");
    const proximos = allDocs.filter((doc) => doc.status === "PRÓXIMO");
    const vigentes = allDocs.filter((doc) => doc.status === "VIGENTE");

    // Ordenar los que tienen fecha por proximidad
    vencidos.sort(
        (a, b) => (a.date as Date).getTime() - (b.date as Date).getTime(),
    );
    proximos.sort(
        (a, b) => (a.date as Date).getTime() - (b.date as Date).getTime(),
    );
    vigentes.sort(
        (a, b) => (a.date as Date).getTime() - (b.date as Date).getTime(),
    );

    // Determinar el documento de mayor prioridad
    // 1. Pendientes (NA), 2. Vencidos, 3. Próximos, 4. Vigentes
    const priorityDoc =
        pendientes.length > 0
            ? pendientes[0]
            : vencidos.length > 0
                ? vencidos[0]
                : proximos.length > 0
                    ? proximos[0]
                    : vigentes.length > 0
                        ? vigentes[0]
                        : null;

    return {
        allDocs,
        pendientes,
        vencidos,
        proximos,
        vigentes,
        priorityDoc,
    };
};

// Función para verificar el estado de documentos
const checkDocumentStatus = (date: string) => {
    if (!date) return "NA";
    const today = new Date();
    const expiryDate = new Date(date);
    const thirtyDaysFromNow = new Date();

    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (expiryDate < today) {
        return "VENCIDO";
    } else if (expiryDate <= thirtyDaysFromNow) {
        return "PRÓXIMO";
    } else {
        return "VIGENTE";
    }
};

// Nueva interfaz para controlar animaciones de filas
interface RowAnimationState {
    [key: string]: {
        isNew: boolean;
        isUpdated: boolean;
        timestamp: number;
    };
}

// Componente principal de tabla de vehículos
const VehiculosTable = ({ vehiculos }: { vehiculos: Vehiculo[] }) => {
    const [page, setPage] = useState(1);
    const { abrirModalDetalle, socketEventLogs } = useFlota();
    const itemsPerPage = 10;
    const totalPages = Math.ceil(vehiculos.length / itemsPerPage);

    // Filtrar vehículos según la página actual
    const vehiculosPaginados = vehiculos.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    // Función para cambiar de página
    const cambiarPagina = (nuevaPagina: number) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
            setPage(nuevaPagina);
        }
    };

    // Obtener color según el estado del vehículo
    const getStatusColor = (estado: string) => {
        switch (estado) {
            case "ACTIVO":
                return "bg-emerald-100 text-emerald-800";
            case "INACTIVO":
                return "bg-red-100 text-red-800";
            case "MANTENIMIENTO":
                return "bg-amber-100 text-amber-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Estado para animaciones de filas
    const [rowAnimations, setRowAnimations] = useState<RowAnimationState>({});

    // Referencia para scroll automático a nuevos elementos
    const tableRef = useRef<HTMLTableElement>(null);

    // Procesar eventos de socket para marcar filas como nuevas o actualizadas
    useEffect(() => {
        if (!socketEventLogs || socketEventLogs.length === 0) return;

        // Obtener el evento más reciente
        const latestEvents = [...socketEventLogs]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5); // Solo procesar los 5 eventos más recientes

        const now = Date.now();
        const newAnimations: RowAnimationState = { ...rowAnimations };

        latestEvents.forEach((event) => {
            // Manejar creación de liquidación
            if (event.eventName === "vehiculo_creado" && event.data.vehiculo) {
                const vehiculoId = event.data.vehiculo.id;

                newAnimations[vehiculoId] = {
                    isNew: true,
                    isUpdated: false,
                    timestamp: now,
                };

                // Scroll a la liquidación nueva (en el siguiente ciclo de renderizado)
                setTimeout(() => {
                    const row = document.getElementById(
                        `vehiculo-row-${vehiculoId}`,
                    );

                    if (row) {
                        row.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }, 100);
            }

            // Manejar actualización de liquidación
            else if (
                event.eventName === "vehiculo_actualizado" &&
                event.data.vehiculo
            ) {
                const vehiculoId = event.data.vehiculo.id;

                // Solo marcar como actualizada si no es nueva
                if (!newAnimations[vehiculoId]?.isNew) {
                    newAnimations[vehiculoId] = {
                        isNew: false,
                        isUpdated: true,
                        timestamp: now,
                    };
                }
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
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <div className="overflow-x-auto">
                <table ref={tableRef} className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr className="uppercase">
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                Vehículo
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Propietario
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Características
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Estado
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Documentos
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {vehiculosPaginados.length > 0 ? (
                            vehiculosPaginados.map((vehicle) => {
                                // Verificar si esta fila tiene animación activa
                                const animation = rowAnimations[vehicle.id];
                                const isNew = animation?.isNew || false;
                                const isUpdated = animation?.isUpdated || false;
                                return (
                                    <tr
                                        key={vehicle.id}
                                        className={`
                                            hover:bg-gray-50 hover:cursor-pointer 
                                            ${isNew ? "animate-highlight-new bg-green-50" : ""}
                                            ${isUpdated ? "animate-highlight-update bg-blue-50" : ""}
                                          `} onClick={() => abrirModalDetalle(vehicle.id)}
                                        id={`vehiculo-row-${vehicle.id}`}
                                    >
                                        {/* Información del vehículo */}
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm relative">

                                            <div className="font-semibold text-gray-900">
                                                {/* Indicador de elemento nuevo/actualizado */}
                                                {isNew && (
                                                    <span className="absolute h-full w-1 bg-green-500 left-0 top-0" />
                                                )}
                                                {isUpdated && !isNew && (
                                                    <span className="absolute h-full w-1 bg-blue-500 left-0 top-0" />
                                                )}
                                                {vehicle.placa}</div>
                                            <div className="text-gray-500">{vehicle.marca} {vehicle.linea}</div>
                                        </td>

                                        {/* Información del propietario */}
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <div className="text-gray-900">{vehicle.propietarioNombre}</div>
                                            <div className="text-gray-500 text-xs">{vehicle.propietarioIdentificacion}</div>
                                        </td>

                                        {/* Características del vehículo */}
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <div className="text-gray-900">
                                                <span className="text-gray-500">Modelo:</span> {vehicle.modelo} |
                                                <span className="text-gray-500 ml-1">Color:</span> {vehicle.color}
                                            </div>
                                            <div className="text-gray-900">
                                                <span className="text-gray-500">Clase:</span> {vehicle.claseVehiculo} |
                                                <span className="text-gray-500 ml-1">Comb:</span> {vehicle.combustible}
                                            </div>
                                        </td>

                                        {/* Estado del vehículo */}
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.estado)}`}>
                                                {vehicle.estado}
                                            </span>
                                        </td>

                                        {/* Información de documentos */}
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <TableDocumentInfo vehicle={vehicle} />
                                        </td>

                                    </tr>
                                )
                            }
                            )
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-8 text-center">
                                    <TruckIcon className="mx-auto h-12 w-12 text-gray-300" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        No hay vehículos
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        No se encontraron vehículos con los criterios de búsqueda actuales.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {vehiculos.length > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => cambiarPagina(page - 1)}
                            disabled={page === 1}
                            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => cambiarPagina(page + 1)}
                            disabled={page === totalPages}
                            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                        >
                            Siguiente
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Mostrando <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> a{" "}
                                <span className="font-medium">
                                    {Math.min(page * itemsPerPage, vehiculos.length)}
                                </span>{" "}
                                de <span className="font-medium">{vehiculos.length}</span> vehículos
                            </p>
                        </div>
                        <div>
                            <div className="flex space-x-2">
                                <button
                                    className={`px-3 py-1 border rounded-md ${page === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                    disabled={page === 1}
                                    onClick={() => cambiarPagina(page - 1)}
                                >
                                    Anterior
                                </button>

                                {Array.from(
                                    {
                                        length: Math.min(
                                            5,
                                            Math.ceil(vehiculos.length / itemsPerPage),
                                        ),
                                    },
                                    (_, i) => {
                                        // Lógica para mostrar páginas alrededor de la página actual
                                        let pageNum;
                                        const totalPages = Math.ceil(
                                            vehiculos.length / itemsPerPage,
                                        );

                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                className={`px-3 py-1 border rounded-md ${page === pageNum
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-white text-gray-700 hover:bg-gray-50"
                                                    }`}
                                                onClick={() => cambiarPagina(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    },
                                )}

                                <button
                                    className={`px-3 py-1 border rounded-md ${page ===
                                        Math.ceil(vehiculos.length / itemsPerPage)
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                    disabled={
                                        page ===
                                        Math.ceil(vehiculos.length / itemsPerPage)
                                    }
                                    onClick={() => cambiarPagina(page + 1)}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente para mostrar la información de documentos en la tabla
const TableDocumentInfo = ({ vehicle }: { vehicle: Vehiculo }) => {
    const { pendientes, vencidos, proximos, priorityDoc } = getDocumentStatus(vehicle);

    // Determinar el color del indicador según el estado de los documentos
    const getStatusIndicator = () => {
        if (vencidos.length > 0) {
            return "bg-red-100 text-red-800";
        } else if (proximos.length > 0) {
            return "bg-amber-100 text-amber-800";
        } else if (pendientes.length > 0) {
            return "bg-gray-100 text-gray-800";
        } else {
            return "bg-emerald-100 text-emerald-800";
        }
    };

    // Formatear fecha para mostrar
    const formatDate = (date: Date | null) => {
        if (!date) return "No registrada";

        return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Obtener color basado en estado
    const getStatusColor = (status: string) => {
        switch (status) {
            case "VENCIDO":
                return "bg-red-100 text-red-800";
            case "PRÓXIMO":
                return "bg-amber-100 text-amber-800";
            case "VIGENTE":
                return "bg-emerald-100 text-emerald-800";
            case "NA":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Crear texto de resumen 
    const getSummaryText = () => {
        if (vencidos.length > 0) {
            return `${vencidos.length} doc. vencido${vencidos.length > 1 ? "s" : ""}`;
        } else if (proximos.length > 0) {
            return `${proximos.length} doc. próx. a vencer`;
        } else if (pendientes.length > 0) {
            return `${pendientes.length} doc. pendiente${pendientes.length > 1 ? "s" : ""}`;
        } else {
            return "Documentos al día";
        }
    };

    return (
        <div>
            {/* Indicador de resumen de documentos */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusIndicator()}`}>
                {getSummaryText()}
            </span>

            {/* Documento prioritario si existe */}
            {priorityDoc && (
                <div className="mt-1 text-xs">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getStatusColor(priorityDoc.status)}`}>
                        {priorityDoc.name}:{" "}
                        {priorityDoc.status === "NA"
                            ? "No registrado"
                            : formatDate(priorityDoc.date)}
                    </span>
                </div>
            )}
        </div>
    );
};



export default VehiculosTable;