"use client"

// VehiculoDocumentUploader.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
} from "@heroui/button";
import { Upload, FileText, XCircle } from 'lucide-react';
import { Alert } from '@heroui/alert';
import { apiClient } from '@/config/apiClient';
import socketService from '@/services/socketServices';

// Lista de tipos de documentos requeridos
const DOCUMENTOS_REQUERIDOS = [
  { id: 'TARJETA_DE_PROPIEDAD', nombre: 'Tarjeta de Propiedad', isRequired: true },
  { id: 'SOAT', nombre: 'SOAT', isRequired: true },
  { id: 'TECNOMECANICA', nombre: 'Tecnomecánica', isRequired: true },
  { id: 'TARJETA_DE_OPERACION', nombre: 'Tarjeta de Operación', isRequired: true },
  { id: 'POLIZA_CONTRACTUAL', nombre: 'Póliza Contractual', isRequired: true },
  { id: 'POLIZA_EXTRACONTRACTUAL', nombre: 'Póliza Extracontractual', isRequired: true },
  { id: 'POLIZA_TODO_RIESGO', nombre: 'Póliza Todo Riesgo', isRequired: true }
];

interface DocumentUploaderProps {
  docType: { id: string; nombre: string; isRequired: boolean };
  file: Documento | File | null;  // Cambia esto para aceptar File
  onChange: (docId: string, file: File) => void;
  onRemove: (docId: string) => void;
  isRequired?: boolean;
  isPending?: boolean;
  processingStatus?: string | null;
}

const DocumentUploader = ({ docType, file, onChange, onRemove, isRequired, isPending, processingStatus }: DocumentUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para manejar el arrastrar y soltar
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onChange(docType.id, e.dataTransfer.files[0]);
    }
  };

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onChange(docType.id, e.target.files[0]);
    }
  };

  // Obtener color y estado según el estado de procesamiento
  const getStatusInfo = () => {
    if (!file) return { color: 'gray', text: 'Pendiente' };

    if (!processingStatus) return { color: 'emerald', text: 'Listo para enviar' };
    switch (processingStatus) {
      case 'procesando':
        return { color: 'warning', text: 'Procesando...' };
      case 'completado':
        return { color: 'emerald', text: 'Procesado correctamente' };
      case 'error':
        return { color: 'danger', text: 'Error al procesar' };
      default:
        return { color: 'primary', text: 'Pendiente de procesar' };
    }
  };

  const { color, text } = getStatusInfo();

  return (
    <div className={`border rounded-lg p-4 ${isDragging ? 'border-primary bg-blue-50' : 'border-gray-300'}`}>
      <div className="flex justify-between items-start mb-2">
        <h4>
          {docType.nombre} {isRequired && <span className="text-red-500">*</span>}
        </h4>

        <div className={`px-2 py-1 rounded text-sm bg-${color}-100 text-${color}-800`}>
          {text}
        </div>
      </div>

      {!file ? (
        <div
          className="border-2 border-dashed rounded p-4 text-center text-sm cursor-pointer transition-colors hover:bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={isPending}
          />

          <Upload className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
          <p className="text-gray-600">
            Arrastra y suelta o haz clic para seleccionar
          </p>
          <p className="text-gray-500">
            PDF, JPG o PNG (Máx. 10MB)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div className="flex items-center text-sm">
            <FileText className="h-5 w-5 text-emerald-600 mr-2" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>

          {!isPending && (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onRemove(docType.id)}
              className="text-red-500 border-0"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

interface ProcesamientoProps {
  sessionId: string | null;
  estado: string | null; // 'iniciando', 'en_proceso', 'completado', 'fallido'
  progreso: number;
  procesados: number;
  total: number;
  mensaje: string;
  estadosPorDocumento: Record<string, string>;
}

interface Documento {
  // Propiedades del documento
  name: string;
  url: string;
  tipo: string;
  size: number
  // otras propiedades...
}

interface ErrorProcesamientoProps extends ProcesamientoProps {
  categoria: string;
  etapa?: string;
  codigo?: string;
  resetRequired?: boolean;
}

const initialProcesamientoState: ProcesamientoProps = {
  sessionId: null,
  estado: null, // 'iniciando', 'en_proceso', 'completado', 'fallido'
  progreso: 0,
  procesados: 0,
  total: 0,
  mensaje: '',
  estadosPorDocumento: {}
};

const VehiculoDocumentUploader = ({ id }: { id?: string }) => {
  // Estado para almacenar los archivos
  const [documentos, setDocumentos] = useState<Record<string, Documento | File>>({});
  const isEditMode = !!id;

  const documentosRequeridos = React.useMemo(() => {
    return DOCUMENTOS_REQUERIDOS.map(doc => ({
      ...doc,
      // Si estamos en modo edición, ningún documento es estrictamente requerido
      isRequired: isEditMode ? false : doc.isRequired
    }));
  }, [isEditMode]);


  // Estado para el procesamiento de documentos
  const [procesamiento, setProcesamiento] = useState<ProcesamientoProps>(initialProcesamientoState);

  // Estado para mensajes de error/éxito
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estado de carga
  const [cargando, setCargando] = useState(false);

  // Función centralizada para resetear el proceso
  const resetearProceso = useCallback(() => {
    // Resetear documentos subidos
    setDocumentos({});

    // Resetear estado de procesamiento usando el estado inicial
    setProcesamiento(initialProcesamientoState);

    // Limpiar mensajes
    setMensaje({ tipo: '', texto: '' });

    // Resetear estado de carga
    setCargando(false);
  }, []);

  // Función para mostrar mensajes y opcionalmente programar reset
  const mostrarMensaje = useCallback((tipo: string, texto: string, resetearDespuesDe?: number) => {
    setMensaje({ tipo, texto });

    if (resetearDespuesDe) {
      setTimeout(resetearProceso, resetearDespuesDe);
    }
  }, [resetearProceso]);

  // Manejador centralizado de errores del procesamiento
  const manejarErrorProcesamiento = useCallback((data: ErrorProcesamientoProps) => {
    console.error('Error de procesamiento:', data);

    // Determinar si el error requiere un reset completo
    const errorRequiereReset =
      data.mensaje?.includes('ya existe en el sistema') || // Para placas duplicadas
      data.etapa === 'verificacion-placa' ||              // Errores en verificación de placa
      data.codigo === 'PLACA_DUPLICADA' ||                // Si estás usando código de error
      data.resetRequired;                                 // Flag explícito desde el backend

    // Actualizar el estado de procesamiento para mostrar el error
    setProcesamiento(prev => ({
      ...prev,
      estado: 'fallido',
      mensaje: data.mensaje,
      estadosPorDocumento: {
        ...prev.estadosPorDocumento,
        [data.categoria]: 'error'
      }
    }));

    // Mostrar mensaje de error y resetear si es necesario
    const mensajeTexto = errorRequiereReset
      ? `${data.mensaje} - El proceso ha sido terminado.`
      : data.mensaje || 'Error en el procesamiento';

    mostrarMensaje('error', mensajeTexto, errorRequiereReset ? 5000 : undefined);
  }, [mostrarMensaje]);

  // Manejador para documento procesado exitosamente
  const manejarDocumentoProcesado = useCallback((data: ProcesamientoProps & { categoria: string }) => {
    setProcesamiento(prev => ({
      ...prev,
      progreso: data.progreso,
      procesados: data.procesados || prev.procesados,
      estadosPorDocumento: {
        ...prev.estadosPorDocumento,
        [data.categoria]: 'completado'
      }
    }));
  }, []);

  // Manejador para vehículo creado exitosamente
  const manejarVehiculoCreado = useCallback(() => {
    setProcesamiento(prev => ({
      ...prev,
      estado: 'completado',
      progreso: 100,
      procesados: prev.total
    }));

    mostrarMensaje(
      'success',
      isEditMode ? "Vehículo actualizado correctamente" : "Vehículo registrado correctamente",
      3000
    );
  }, [isEditMode, mostrarMensaje]);

  // Suscribirse a actualizaciones de procesamiento cuando hay un sessionId
  useEffect(() => {
    if (!socketService || !procesamiento.sessionId) return;

    // Suscribirse al canal de la sesión
    socketService.emit('suscribir-proceso', procesamiento.sessionId);

    // Registrar eventos con los manejadores centralizados
    socketService.on('documento-procesado', manejarDocumentoProcesado);
    socketService.on('error-procesamiento', manejarErrorProcesamiento);
    socketService.on('vehiculo-creado', manejarVehiculoCreado);

    // Limpiar eventos al desmontar
    return () => {
      socketService.off('documento-procesado', manejarDocumentoProcesado);
      socketService.off('error-procesamiento', manejarErrorProcesamiento);
      socketService.off('vehiculo-creado', manejarVehiculoCreado);

      // Desuscribirse explícitamente al salir
      socketService.emit('desuscribir-proceso', procesamiento.sessionId);
    };
  }, [
    procesamiento.sessionId,
    manejarDocumentoProcesado,
    manejarErrorProcesamiento,
    manejarVehiculoCreado
  ]);

  // Verificar estado periódicamente con manejo de caducidad y retroceso exponencial
  useEffect(() => {
    if (!procesamiento.sessionId || procesamiento.estado === 'completado' || procesamiento.estado === 'fallido') {
      return; // No consultar si no hay sesión o el proceso ya terminó
    }

    let intentos = 0;
    const maxIntentos = 8; // Máximo número de intentos fallidos consecutivos
    const intervaloBase = 5000; // 5 segundos
    const intervaloMax = 30000; // Máximo 30 segundos entre intentos

    const verificarEstado = async () => {
      try {
        const response = await apiClient.get(`/api/flota/progreso/${procesamiento.sessionId}`);

        if (response && response.data) {
          intentos = 0; // Reiniciar contador de intentos al tener éxito
          const { procesados, total, progreso, completado, error } = response.data;

          // Si hay un error reportado por la API
          if (error) {
            // Construir un objeto de error similar al que viene por websocket
            manejarErrorProcesamiento({
              ...initialProcesamientoState,
              sessionId: procesamiento.sessionId,
              mensaje: error.mensaje || 'Error en el procesamiento',
              categoria: error.categoria || 'general',
              codigo: error.codigo,
              resetRequired: error.resetRequired
            });
            return;
          }

          // Actualizar estado normalmente
          setProcesamiento(prev => ({
            ...prev,
            progreso: progreso !== undefined ? progreso : prev.progreso,
            procesados: procesados !== undefined ? procesados : prev.procesados,
            total: total !== undefined ? total : prev.total,
            estado: completado ? 'completado' : prev.estado || 'en_proceso'
          }));

          if (completado) {
            manejarVehiculoCreado();
          }
        }
      } catch (error) {
        console.error('Error al verificar estado:', error);
        intentos++;

        // Si superamos el máximo de intentos, consideramos que el proceso ha fallado
        if (intentos >= maxIntentos) {
          manejarErrorProcesamiento({
            ...initialProcesamientoState,
            sessionId: procesamiento.sessionId,
            mensaje: 'No se pudo verificar el estado del proceso después de varios intentos.',
            categoria: 'sistema',
            resetRequired: true
          });
        }
      }
    };

    // Calcular intervalo con retroceso exponencial
    const calcularIntervalo = () => {
      return Math.min(intervaloBase * Math.pow(1.5, intentos), intervaloMax);
    };

    // Iniciar verificación inmediata
    verificarEstado();

    // Establecer intervalo dinámico
    const intervalo = setInterval(() => {
      verificarEstado();
    }, calcularIntervalo());

    return () => clearInterval(intervalo);
  }, [
    procesamiento.sessionId,
    procesamiento.estado,
    manejarErrorProcesamiento,
    manejarVehiculoCreado
  ]);

  // Función principal para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Verificar que hay al menos un documento seleccionado
    if (Object.keys(documentos).length === 0 && isEditMode) {
      mostrarMensaje('error', "Debes seleccionar al menos un documento para actualizar");
      return;
    }

    // Validar documentos requeridos solo si no estamos en modo edición
    if (!isEditMode) {
      const documentosFaltantes = documentosRequeridos
        .filter(doc => doc.isRequired && !documentos[doc.id])
        .map(doc => doc.nombre);

      if (documentosFaltantes.length > 0) {
        mostrarMensaje('error', `Faltan documentos requeridos: ${documentosFaltantes.join(', ')}`);
        return;
      }
    }

    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // Iniciar el estado del procesamiento
      setProcesamiento(prev => ({
        ...prev,
        estado: 'iniciando'
      }));

      // Ejecutar la función apropiada según el modo
      const success = isEditMode
        ? await updateVehiculo()
        : await createVehiculo();

      if (!success) {
        // Si la operación devolvió falso pero no lanzó error
        mostrarMensaje('error', 'La operación no pudo completarse correctamente');
        setProcesamiento(prev => ({
          ...prev,
          estado: 'fallido'
        }));
      }
    } catch (error: any) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} vehículo:`, error);

      setProcesamiento(prev => ({
        ...prev,
        estado: 'fallido'
      }));

      mostrarMensaje(
        'error',
        error.response?.data?.message || 'Error al procesar la solicitud'
      );
    } finally {
      setCargando(false);
    }
  };

  // Manejar cambio de archivo
  const handleDocumentoChange = (docId: string, file: File) => {
    setDocumentos(prev => ({
      ...prev,
      [docId]: file
    }));
  };

  // Manejar eliminación de archivo
  const handleDocumentoRemove = (docId: string) => {
    setDocumentos(prev => {
      const newDocs = { ...prev };
      delete newDocs[docId];
      return newDocs;
    });
  };

  const prepareFormData = () => {
    const formData = new FormData();

    // Añadir archivos
    Object.entries(documentos).forEach(([docId, file]) => {
      if (file instanceof File || file instanceof Blob) {
        // If it's already a File or Blob, append it directly
        formData.append('documentos', file);
      } else {
        // If it's a Documento object, extract the File or Blob from it
        if ('archivo' in file && file.archivo instanceof File) {
          formData.append('documentos', file.archivo);
        } else if ('file' in file && file.file instanceof File) {
          formData.append('documentos', file.file);
        } else {
          console.error('Cannot append document to FormData: not a valid File or Blob', file);
        }
      }
    });

    // Añadir categorías
    formData.append('categorias', JSON.stringify(Object.keys(documentos)));

    // Añadir socketId si está disponible
    if (socketService.isConnected()) {
      const socketId = socketService.getSocketId();
      if (socketId) {
        formData.append('socketId', socketId);
      }
    }

    return formData;
  };

  // Función para crear un nuevo vehículo
  const createVehiculo = async () => {
    const formData = prepareFormData();

    // Configurar headers para el socketId
    const headers = socketService.isConnected() ?
      { 'socket-id': socketService.getSocketId() } : {};

    // Enviar solicitud
    const response = await apiClient.post('/api/flota', formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success) {
      // Iniciar seguimiento del procesamiento
      setProcesamiento({
        sessionId: response.data.sessionId,
        estado: 'iniciando',
        progreso: 0,
        procesados: 0,
        total: Object.keys(documentos).length,
        mensaje: '',
        estadosPorDocumento: Object.keys(documentos).reduce<Record<string, string>>((acc, docId) => {
          acc[docId] = 'procesando';
          return acc;
        }, {})
      });

      setMensaje({
        tipo: 'info',
        texto: 'Procesando documentos. Esto puede tomar algunos minutos...'
      });

      return true;
    } else {
      setMensaje({
        tipo: 'error',
        texto: response.data.message || 'Error al iniciar el procesamiento'
      });

      return false;
    }
  };

  // Función para actualizar documentos de un vehículo existente
  const updateVehiculo = async () => {
    const formData = prepareFormData();

    // Añadir ID del vehículo
    if (id) {
      formData.append('vehiculoId', id);
    }

    // Configurar headers para el socketId
    const headers = socketService.isConnected() ?
      { 'socket-id': socketService.getSocketId() } : {};

    // Enviar solicitud de actualización
    const response = await apiClient.put(`/api/flota/${id}`, formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success) {
      // Establecer procesamiento para documentos actualizados
      setProcesamiento({
        sessionId: response.data.sessionId,
        estado: 'iniciando',
        progreso: 0,
        procesados: 0,
        total: Object.keys(documentos).length,
        mensaje: '',
        estadosPorDocumento: Object.keys(documentos).reduce<Record<string, string>>((acc, docId) => {
          acc[docId] = 'procesando';
          return acc;
        }, {})
      });

      setMensaje({
        tipo: 'info',
        texto: 'Actualizando documentos del vehículo...'
      });

      return true;
    } else {
      setMensaje({
        tipo: 'error',
        texto: response.data.message || 'Error al actualizar los documentos'
      });

      return false;
    }
  };

  // Verificar si está en proceso
  const enProceso = procesamiento.estado === 'iniciando' || procesamiento.estado === 'en_proceso';

  return (
    <div className="container mx-auto">

      {mensaje.texto && (
        <div className="flex justify-between gap-4 items-center mb-5">
          <Alert
            color={mensaje.tipo === 'error' ? 'danger' : mensaje.tipo === 'info' ? 'primary' : 'success'}
          >
            {mensaje.texto}
          </Alert>
          {procesamiento.estado === 'fallido' && (
            <Button
              className="text-red-600 hover:text-red-900 transition-colors bg-transparent"
              disabled={!procesamiento.sessionId || enProceso}
              onPress={resetearProceso}
            >
              Reiniciar proceso
            </Button>
          )}
        </div>
      )}

      {procesamiento.sessionId && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <p>Progreso del procesamiento</p>
            <p>{procesamiento.procesados || 0} de {procesamiento.total || 0} ({procesamiento.progreso || 0}%)</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-width ease-in-out duration-300"
              style={{ width: `${procesamiento.progreso || 0}%` }}
            ></div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentosRequeridos.map(docType => (
            <DocumentUploader
              key={docType.id}
              docType={docType}
              file={documentos[docType.id]}
              onChange={handleDocumentoChange}
              onRemove={handleDocumentoRemove}
              isRequired={docType.isRequired}
              isPending={enProceso}
              processingStatus={procesamiento.estadosPorDocumento?.[docType.id]}
            />
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="submit"
            className={`bg-emerald-600 text-white rounded-md ${cargando ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {cargando ? 'Enviando...' : isEditMode ? "Actualizar Vehículo" : 'Registrar Vehículo'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VehiculoDocumentUploader;