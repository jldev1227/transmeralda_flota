import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { SaveIcon, TruckIcon } from "lucide-react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";

import { Vehiculo } from "@/context/FlotaContext";
import SimpleDocumentUploader from "../documentSimpleUpload";
import { addToast } from "@heroui/toast";
import socketService from "@/services/socketServices";

interface ModalFormVehiculoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehiculo: Vehiculo) => Promise<void>;
  vehiculoEditar?: Vehiculo | null;
  titulo?: string;
}

type VehiculoKey = keyof Vehiculo;

interface Procesamiento {
  sessionId: string | null;
  procesados: number;
  total: number;
  progreso: number;
  estado: string | null; // 'iniciando', 'en_proceso', 'completado', 'fallido'
  mensaje: string;
  error: string | null;
  porcentaje: number;
}

const initialProcesamientoState: Procesamiento = {
  sessionId: "1728dfa2-00f5-43d4-921b-70c7d84d9468",
  procesados: 0,
  total: 0,
  progreso: 0,
  estado: null, // 'iniciando', 'en_proceso', 'completado', 'fallido'
  mensaje: "",
  error: '{}',
  porcentaje: 0,
};

const ModalFormVehiculo: React.FC<ModalFormVehiculoProps> = ({
  isOpen,
  onClose,
  onSave,
  vehiculoEditar = null,
  titulo = "Registrar Nuevo Vehículo",
}) => {
  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState<Partial<Vehiculo>>({
    placa: "",
    marca: "",
    clase_vehiculo: "",
    color: "",
    modelo: "",
    linea: "",
  });

  // Estado para el procesamiento de documentos
  const [procesamiento, setProcesamiento] = useState<Procesamiento>(
    initialProcesamientoState,
  );

  const [loading, setLoading] = useState<boolean>(false)
  const [subirDocumentos, setSubirDocumentos] = useState(true);
  const [documentos, setDocumentos] = useState<Record<string, any>>({});

  // Estado para manejar la validación
  const [errores, setErrores] = useState<Record<string, boolean>>({
    placa: false,
    marca: false,
    clase_vehiculo: false,
    modelo: false,
    linea: false,
  });

  // Estado para errores de documentos
  const [erroresDocumentos, setErroresDocumentos] = useState<Record<string, boolean>>({});

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      placa: "",
      marca: "",
      clase_vehiculo: "",
      color: "",
      modelo: "",
      linea: "",
    });
    setErrores({
      placa: false,
      marca: false,
      clase_vehiculo: false,
      modelo: false,
      linea: false,
    });
    setDocumentos({});
    setErroresDocumentos({});
  };

  // Efecto para cargar datos cuando se está editando
  useEffect(() => {
    if (vehiculoEditar) {
      setFormData({
        ...vehiculoEditar,
      });
    } else {
      // Resetear el formulario si no hay conductor para editar
      resetForm();
    }
  }, [vehiculoEditar, isOpen]);

  useEffect(() => {
    if (!socketService || !procesamiento.sessionId) return;

    const handleProgreso = (data: any) => {
      setProcesamiento(prev => ({
        ...prev,
        procesados: data.procesados || prev.procesados,
        progreso: data.progreso || prev.progreso,
        mensaje: data.mensaje || prev.mensaje,
        porcentaje: data.porcentaje || prev.porcentaje
      }));
    };

    const handleCompletado = () => {
      setProcesamiento(prev => ({
        ...prev,
        estado: 'completado',
        progreso: 100,
        porcentaje: 100,
        mensaje: 'Vehículo creado exitosamente'
      }));

      addToast({
        title: "¡Éxito!",
        description: "Vehículo creado correctamente",
        color: "success"
      });

      onClose(); // Cerrar modal
    };

    const handleError = (data: any) => {
      setProcesamiento(prev => ({
        ...prev,
        estado: 'error',
        error: data.error,
        mensaje: 'Error al procesar'
      }));

      addToast({
        title: "Error",
        description: data.error || "Error al crear vehículo",
        color: "danger"
      });
    };

    socketService.on("vehiculo:procesamiento:progreso", handleProgreso);
    socketService.on("vehiculo:procesamiento:completado", handleCompletado);
    socketService.on("vehiculo:procesamiento:error", handleError);

    return () => {
      socketService.off("vehiculo:procesamiento:progreso", handleProgreso);
      socketService.off("vehiculo:procesamiento:completado", handleCompletado);
      socketService.off("vehiculo:procesamiento:error", handleError);
    };
  }, [procesamiento.sessionId]);

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error al escribir
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  // Manejar cambios en los selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error al seleccionar
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  // Validar y guardar datos
  const handleSave = async () => {
    setLoading(true);

    // Campos requeridos para todos los vehículos
    const camposRequeridos: VehiculoKey[] = [
      "placa",
      "marca",
      "clase_vehiculo",
      "modelo",
      "linea",
      "color",
    ];

    // Validar campos requeridos
    const nuevosErrores: Record<string, boolean> = {};

    camposRequeridos.forEach((campo) => {
      if (!formData[campo]) {
        nuevosErrores[campo] = true;
      }
    });

    setErrores(nuevosErrores);

    // Si hay errores, no continuar
    if (Object.values(nuevosErrores).some((error) => error)) {
      setLoading(false);
      return;
    }

    // Validar documentos requeridos si está habilitado
    if (subirDocumentos) {
      const missingDocs = validateRequiredDocuments();
      if (missingDocs.length > 0) {
        addToast({
          title: `Falta documentación!`,
          description: `Faltan documentos requeridos: ${missingDocs.join(', ')}`,
          color: "danger",
        });
        setLoading(false);
        return;
      }

      // Validar fechas de vigencia requeridas
      const missingVigencias = validateRequiredVigencias();
      if (missingVigencias.length > 0) {
        addToast({
          title: `Falta documentación!`,
          description: `Faltan fechas de vigencia requeridas para: ${missingVigencias.join(', ')}`,
          color: "danger",
        });
        setLoading(false);
        return;
      }
    }

    // Preparar datos completos incluyendo documentos
    const datosCompletos = {
      ...formData,
      documentos: subirDocumentos ? preparearDocumentosParaEnvio() : null
    };

    try {
      await onSave(datosCompletos as Vehiculo);
    } finally {
      setLoading(false);
    }
  };

  // Función para preparar los documentos para envío
  const preparearDocumentosParaEnvio = () => {
    const documentosParaEnvio: Record<string, any> = {};

    Object.keys(documentos).forEach((key) => {
      const documento = documentos[key];
      if (documento) {
        documentosParaEnvio[key] = {
          file: documento.file,
          ...(documento.fecha_vigencia && { fecha_vigencia: documento.fecha_vigencia })
        };
      }
    });

    return documentosParaEnvio;
  };

  const clasesVehiculo = [
    { key: "CAMIONETA", label: "Camioneta" },
    { key: "BUS", label: "Bus" },
    { key: "MICROBUS", label: "Microbús" },
  ];

  // Manejar cambios en los switches
  const handleSwitchChange = (name: string, checked: boolean) => {
    if (name === "subirDocumentos") {
      setSubirDocumentos(checked);
      if (!checked) {
        setDocumentos({});
      }
      return;
    }
  };

  const documentTypes = [
    {
      key: "TARJETA_DE_PROPIEDAD",
      label: "Tarjeta de Propiedad",
      required: true,
      vigencia: false,
    },
    {
      key: "SOAT",
      label: "SOAT",
      required: false,
      vigencia: true, // Tiene fecha de vigencia
    },
    {
      key: "TECNOMECANICA",
      label: "Tecnomecánica",
      required: false,
      vigencia: true, // Tiene fecha de vigencia
    },
    {
      key: "TARJETA_DE_OPERACION",
      label: "Tarjeta de Operación",
      required: false,
      vigencia: true,
    },
    {
      key: "POLIZA_CONTRACTUAL",
      label: "Póliza Contractual",
      required: false,
      vigencia: true,
    },
    {
      key: "POLIZA_EXTRACONTRACTUAL",
      label: "Póliza Extracontractual",
      required: false,
      vigencia: true,
    },
    {
      key: "POLIZA_TODO_RIESGO",
      label: "Póliza Todo Riesgo",
      required: false,
      vigencia: true,
    },
    {
      key: "CERTIFICADO_GPS",
      label: "Certificado GPS",
      required: false,
      vigencia: true,
    },
  ];

  // Manejar cambio de documento
  const handleDocumentChange = (docKey: string, file: File, fecha_vigencia?: Date) => {
    setDocumentos(prev => ({
      ...prev,
      [docKey]: {
        file,
        fecha_vigencia,
        uploadedAt: new Date()
      }
    }));

    // Limpiar error al cambiar documento
    if (erroresDocumentos[docKey]) {
      setErroresDocumentos(prev => ({
        ...prev,
        [docKey]: false,
      }));
    }
  };

  // Manejar eliminación de documento
  const handleDocumentRemove = (docKey: string) => {
    setDocumentos(prev => {
      const newDocs = { ...prev };
      delete newDocs[docKey];
      return newDocs;
    });
  };

  // Validar documentos requeridos
  const validateRequiredDocuments = () => {
    const missingDocs = documentTypes
      .filter(doc => doc.required && !documentos[doc.key])
      .map(doc => doc.label);

    return missingDocs;
  };

  // Validar fechas de vigencia requeridas
  const validateRequiredVigencias = () => {
    const nuevosErroresDocumentos: Record<string, boolean> = {};
    const missingVigencias: string[] = [];

    documentTypes.forEach(doc => {
      if (doc.required && doc.vigencia && documentos[doc.key]) {

        // Si el documento existe pero no tiene fecha de vigencia
        if (!documentos[doc.key].fecha_vigencia) {
          nuevosErroresDocumentos[doc.key] = true;
          missingVigencias.push(doc.label);
        }
      }
    });

    setErroresDocumentos(nuevosErroresDocumentos);
    return missingVigencias;
  };

  return (
    <Modal
      backdrop={"blur"}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onClose={onClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center space-x-2">
                <TruckIcon className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold">
                  {vehiculoEditar ? "Editar Vehículo" : titulo}
                </h3>
              </div>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-6">

                {/* Switch para determinar si es de planta */}
                <div className="flex items-center justify-between border p-3 rounded-md bg-gray-50">
                  <div>
                    <span className="font-medium">Registrar con documentación</span>
                    <p className="text-sm text-gray-500">
                      Marque esta opción si adjuntara documentación del vehículo
                    </p>
                  </div>
                  <Switch
                    color="success"
                    isSelected={subirDocumentos}
                    onChange={(e) =>
                      handleSwitchChange("subirDocumentos", e.target.checked)
                    }
                  />
                </div>
                <div className="border p-4 rounded-md">
                  <h4 className="text-md font-semibold mb-4 border-b pb-2">
                    Información Básica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      isRequired
                      errorMessage={
                        errores.placa ? "La placa es requerida" : ""
                      }
                      isInvalid={errores.placa}
                      label="Placa"
                      name="placa"
                      placeholder="Ingrese placa"
                      value={formData.placa || ""}
                      onChange={handleChange}
                    />

                    <Input
                      isRequired
                      errorMessage={
                        errores.marca ? "La marca es requerida" : ""
                      }
                      isInvalid={errores.marca}
                      label="Marca"
                      name="marca"
                      placeholder="Ingrese marca"
                      value={formData.marca || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Select
                      isRequired
                      errorMessage={
                        errores.clase_vehiculo ? "La clase es requerida" : ""
                      }
                      isInvalid={errores.clase_vehiculo}
                      label="Clase de Vehículo"
                      name="clase_vehiculo"
                      placeholder="Seleccione una clase"
                      selectedKeys={
                        formData.clase_vehiculo ? [formData.clase_vehiculo] : []
                      }
                      value={formData.clase_vehiculo || ""}
                      onChange={(e) =>
                        handleSelectChange("clase_vehiculo", e.target.value)
                      }
                    >
                      {clasesVehiculo.map((clase) => (
                        <SelectItem key={clase.key} textValue={clase.label}>
                          {clase.label}
                        </SelectItem>
                      ))}
                    </Select>

                    {/* Color */}
                    <Input
                      isRequired
                      errorMessage={
                        errores.color ? "El color es requerido" : ""
                      }
                      isInvalid={errores.color}
                      label="Color"
                      name="color"
                      placeholder="Ingrese color del vehículo"
                      value={formData.color || ""}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Campos para línea y modelo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Input
                      isRequired
                      errorMessage={
                        errores.linea ? "La línea es requerida" : ""
                      }
                      isInvalid={errores.linea}
                      label="Línea"
                      name="linea"
                      placeholder="Ingrese línea del vehículo (ej. Hilux, Corolla)"
                      value={formData.linea || ""}
                      onChange={handleChange}
                    />

                    <Input
                      isRequired
                      errorMessage={
                        errores.modelo ? "El modelo es requerido" : ""
                      }
                      isInvalid={errores.modelo}
                      label="Modelo (Año)"
                      name="modelo"
                      placeholder="Ingrese modelo/año del vehículo"
                      value={formData.modelo || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {subirDocumentos && (
                  <div className="border p-4 rounded-md">
                    <h4 className="text-md font-semibold mb-4 border-b pb-2">
                      Documentación
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {documentTypes.map((docType) => (
                        <SimpleDocumentUploader
                          key={docType.key}
                          documentKey={docType.key}
                          label={docType.label}
                          required={docType.required}
                          vigencia={docType.vigencia}
                          file={documentos[docType.key]?.file || null}
                          fecha_vigencia={documentos[docType.key]?.fecha_vigencia || null}
                          onChange={handleDocumentChange}
                          onRemove={handleDocumentRemove}
                          errores={erroresDocumentos}
                        />
                      ))}
                    </div>

                    {/* Resumen de documentos cargados */}
                    {Object.keys(documentos).length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <h3 className="font-medium text-blue-900 mb-2">
                          Documentos cargados ({Object.keys(documentos).length})
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {Object.entries(documentos).map(([key, doc]) => {
                            const docType = documentTypes.find(d => d.key === key);
                            return (
                              <li key={key} className="flex justify-between">
                                <span>{docType?.label}</span>
                                <span className="text-blue-600">
                                  {doc.fecha_vigencia
                                    ? `Vigente hasta: ${doc.fecha_vigencia.toLocaleDateString('es-ES')}`
                                    : "✓"
                                  }
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                color="danger"
                radius="sm"
                variant="light"
                onPress={onClose}
              >
                Cancelar
              </Button>
              <Button
                className="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                startContent={loading ? '' : <SaveIcon className="h-4 w-4" />}
                onPress={handleSave}
                isLoading={loading}
              >
                {loading
                  ? vehiculoEditar
                    ? "Actualizando..."
                    : "Guardando..."
                  : vehiculoEditar
                    ? "Actualizar"
                    : "Guardar"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalFormVehiculo;