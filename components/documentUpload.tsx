import { DocumentTextIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { CloudUploadIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

// Definimos los tipos de documentos requeridos
const documentTypes = [
  { id: "soat", name: "SOAT", key: "soatVencimiento" },
  {
    id: "tecnomecanica",
    name: "Técnico-mecánica",
    key: "tecnomecanicaVencimiento",
  },
  {
    id: "tarjetaOperacion",
    name: "Tarjeta de Operación",
    key: "tarjetaDeOperacionVencimiento",
  },
  {
    id: "polizaContractual",
    name: "Póliza Contractual",
    key: "polizaContractualVencimiento",
  },
  {
    id: "polizaExtraContractual",
    name: "Póliza Extra-Contractual",
    key: "polizaExtraContractualVencimiento",
  },
  {
    id: "polizaTodoRiesgo",
    name: "Póliza Todo Riesgo",
    key: "polizaTodoRiesgoVencimiento",
  },
];

const DocumentUploader = ({
  docType,
  file,
  onChange,
  onRemove,
  isRequired,
  isNew,
  isPending,
}) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onChange(docType.id, acceptedFiles[0]);
      }
    },
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="font-medium text-gray-900">
              {docType.name}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h3>
          </div>
          {isPending && (
            <span className="bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded-full font-medium">
              Pendiente
            </span>
          )}
        </div>

        {!file ? (
          <div
            {...getRootProps({
              className:
                "border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-emerald-500 transition-colors text-center",
            })}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Arrastra y suelta un archivo PDF aquí o haz clic para
              seleccionarlo
            </p>
            <p className="text-xs text-gray-400 mt-1">Sólo archivos PDF</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-emerald-500 mr-2" />
                <div>
                  <p
                    className="text-sm font-medium text-gray-900 truncate"
                    style={{ maxWidth: "200px" }}
                  >
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                className="text-red-500 hover:text-red-700"
                type="button"
                onClick={() => onRemove(docType.id)}
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal del formulario
const DocumentUploadForm = ({ vehiculoActual, onSubmit } : {
    vehiculoActual: Vehiculpi,
}) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errors, setErrors] = useState({});

  const isNewVehicle = !vehiculoActual || !vehiculoActual.id;

  // Inicializar estados basados en documentos pendientes
  useEffect(() => {
    if (vehiculoActual) {
      // Para cada tipo de documento, verificamos si está pendiente (NA/no registrado)
      const pendingDocs = {};

      documentTypes.forEach((docType) => {
        const value = vehiculoActual[docType.key];

        pendingDocs[docType.id] =
          !value || value === "NA" || value === "No registrada";
      });

      setErrors(pendingDocs);
    }
  }, [vehiculoActual]);

  const handleFileChange = (docId, file) => {
    setFiles((prev) => ({
      ...prev,
      [docId]: file,
    }));

    // Eliminar error si se ha añadido un archivo
    if (errors[docId]) {
      setErrors((prev) => ({
        ...prev,
        [docId]: false,
      }));
    }
  };

  const handleFileRemove = (docId) => {
    setFiles((prev) => {
      const newFiles = { ...prev };

      delete newFiles[docId];

      return newFiles;
    });

    // Si es un nuevo vehículo, marcar como error al eliminar
    if (isNewVehicle) {
      setErrors((prev) => ({
        ...prev,
        [docId]: true,
      }));
    }
  };

  const validateForm = () => {
    // Si es un nuevo vehículo, todos los documentos son requeridos
    if (isNewVehicle) {
      const newErrors = {};
      let isValid = true;

      documentTypes.forEach((docType) => {
        if (!files[docType.id]) {
          newErrors[docType.id] = true;
          isValid = false;
        } else {
          newErrors[docType.id] = false;
        }
      });

      setErrors(newErrors);

      return isValid;
    }

    // Si es actualización, solo validamos que haya al menos un archivo
    return Object.keys(files).length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const isValid = validateForm();

    if (!isValid) {
      console.log("Formulario inválido");

      return;
    }

    setLoading(true);

    try {
      // Para depuración
      if (isNewVehicle) {
        console.log("Registrando nuevo vehículo con documentos:", files);
      } else {
        console.log(
          "Actualizando documentos del vehículo:",
          vehiculoActual.id,
          files,
        );
      }

      // Procesamiento real de los archivos (comentado por ahora)
      // Crear FormData y añadir archivos
      const formData = new FormData();

      // Añadir ID del vehículo si estamos actualizando
      if (!isNewVehicle && vehiculoActual.id) {
        formData.append("vehiculoId", vehiculoActual.id);
      }

      // Añadir cada archivo con su tipo de documento
      Object.entries(files).forEach(([docId, file]) => {
        formData.append(docId, file);
      });

      // Llamada a la función de envío proporcionada por el componente padre
      if (onSubmit) {
        await onSubmit(formData);
      }

      // Éxito (simulado)
      console.log("Documentos procesados correctamente");
      // Resetear el formulario después del éxito
      if (!isNewVehicle) {
        setFiles({});
        setSubmitAttempted(false);
      }
    } catch (error) {
      console.error("Error al procesar los documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isNewVehicle
            ? "Carga de Documentos Requeridos"
            : "Actualización de Documentos"}
        </h2>

        {isNewVehicle ? (
          <p className="mb-4 text-sm text-gray-600">
            Por favor sube todos los documentos requeridos para registrar el
            vehículo. Todos los campos marcados con * son obligatorios.
          </p>
        ) : (
          <p className="mb-4 text-sm text-gray-600">
            Selecciona los documentos que deseas actualizar. Solo se procesarán
            los documentos que hayas subido.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentTypes.map((docType) => (
            <DocumentUploader
              key={docType.id}
              docType={docType}
              file={files[docType.id]}
              isNew={isNewVehicle}
              isPending={!isNewVehicle && errors[docType.id]}
              isRequired={isNewVehicle}
              onChange={handleFileChange}
              onRemove={handleFileRemove}
            />
          ))}
        </div>

        {submitAttempted &&
          isNewVehicle &&
          Object.values(errors).some((error) => error) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                Por favor, sube todos los documentos requeridos para continuar.
              </p>
            </div>
          )}

        {submitAttempted &&
          !isNewVehicle &&
          Object.keys(files).length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                Debes seleccionar al menos un documento para actualizar.
              </p>
            </div>
          )}
      </div>

      <div className="flex justify-end">
        <button
          className={`px-4 py-2 rounded-md text-white font-medium ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700"
          } transition-colors`}
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                />
              </svg>
              Procesando...
            </span>
          ) : isNewVehicle ? (
            "Registrar Vehículo"
          ) : (
            "Actualizar Documentos"
          )}
        </button>
      </div>
    </form>
  );
};

export default DocumentUploadForm;
