"use client"

// VehiculoDocumentUploader.jsx
import React, { useState, useEffect } from 'react';
import {
  Button,
} from "@heroui/button";
import { Upload, FileText, XCircle } from 'lucide-react';
import { Alert } from '@heroui/alert';
import { apiClient } from '@/config/apiClient';
import { io } from 'socket.io-client';

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

const DocumentUploader = ({ docType, file, onChange, onRemove, isRequired, isPending, processingStatus }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);

  // Función para manejar el arrastrar y soltar
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onChange(docType.id, e.dataTransfer.files[0]);
    }
  };

  // Manejar selección de archivo
  const handleFileChange = (e) => {
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

const VehiculoDocumentUploader = () => {
  // Estado para almacenar los archivos
  const [documentos, setDocumentos] = useState({});

  // Estado para el procesamiento de documentos
  const [procesamiento, setProcesamiento] = useState({
    sessionId: null,
    estado: null, // 'iniciando', 'en_proceso', 'completado', 'fallido'
    progreso: 0,
    procesados: 0,
    total: 0,
    mensaje: '',
    estadosPorDocumento: {}
  });

  // Estado para mensajes de error/éxito
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estado de carga
  const [cargando, setCargando] = useState(false);

  // Socket para comunicación en tiempo real
  const [socket, setSocket] = useState(null);

  // Conectar al socket al montar el componente
  useEffect(() => {
    const nuevoSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

    nuevoSocket.on('connect', () => {
      console.log('Socket conectado:', nuevoSocket.id);
      setSocket(nuevoSocket);
    });

    nuevoSocket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    return () => {
      nuevoSocket.disconnect();
    };
  }, []);

  // Suscribirse a actualizaciones de procesamiento cuando hay un sessionId
  useEffect(() => {
    if (!socket || !procesamiento.sessionId) return;

    // Suscribirse al canal de la sesión
    socket.emit('suscribir-proceso', procesamiento.sessionId);

    // Configurar manejadores de eventos
    const onDocumentoProcesado = (data) => {
      console.log('Documento procesado:', data);
      setProcesamiento(prev => ({
        ...prev,
        progreso: data.progreso,
        procesados: data.procesados || prev.procesados,
        estadosPorDocumento: {
          ...prev.estadosPorDocumento,
          [data.categoria]: 'completado'
        }
      }));
    };

    const onErrorProcesamiento = (data) => {
      console.error('Error de procesamiento:', data);

      // Determinar si el error requiere un reset completo
      const errorRequiereReset =
        data.mensaje?.includes('ya existe en el sistema') || // Para placas duplicadas
        data.etapa === 'verificacion-placa' ||              // Errores en verificación de placa
        data.codigo === 'PLACA_DUPLICADA' ||                // Si estás usando código de error
        data.resetRequired;                                // Flag explícito desde el backend

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

      // Mostrar mensaje de error
      setMensaje({
        tipo: 'error',
        texto: data.mensaje || `Error en el procesamiento`
      });

      // Si el error requiere reset, programar un reset después de mostrar el error
      if (errorRequiereReset) {
        // Mostrar mensaje específico para reset
        setMensaje({
          tipo: 'error',
          texto: `${data.mensaje} - El proceso ha sido terminado.`
        });

        // Esperar un momento para que el usuario pueda leer el mensaje
        setTimeout(() => {
          resetearProceso();
        }, 5000); // 5 segundos para leer el mensaje antes del reset
      }
    };

    const onVehiculoCreado = (data) => {
      console.log('Vehículo creado:', data);

      setProcesamiento(prev => ({
        ...prev,
        estado: 'completado',
        progreso: 100,
        procesados: prev.total
      }));

      setMensaje({
        tipo: 'success',
        texto: 'Vehículo registrado correctamente'
      });

      // Redirigir a la página de detalles o hacer algo con el vehículo creado
      // navigate(`/vehiculos/${data.vehiculo.id}`);
    };

    // Registrar eventos
    socket.on('documento-procesado', onDocumentoProcesado);
    socket.on('error-procesamiento', onErrorProcesamiento);
    socket.on('vehiculo-creado', onVehiculoCreado);

    // Limpiar eventos al desmontar
    return () => {
      socket.off('documento-procesado', onDocumentoProcesado);
      socket.off('error-procesamiento', onErrorProcesamiento);
      socket.off('vehiculo-creado', onVehiculoCreado);
    };
  }, [socket, procesamiento.sessionId]);

  // Verificar estado periódicamente como respaldo si los websockets fallan
  useEffect(() => {
    if (!procesamiento.sessionId) return;

    const verificarEstado = async () => {
      try {
        const response = await apiClient.get(`/api/flota/progreso/${procesamiento.sessionId}`);

        if (response && response.data) {
          const { procesados, total, progreso, completado } = response.data;


          setProcesamiento(prev => ({
            ...prev,
            progreso: progreso || prev.progreso,
            procesados: procesados || prev.procesados,
            total: total || prev.total,
            estado: completado ? 'completado' : 'en_proceso'
          }));

          if (completado) {
            setMensaje({
              tipo: 'success',
              texto: 'Vehículo registrado correctamente'
            });
          }
        }
      } catch (error) {
        console.error('Error al verificar estado:', error);
      }
    };

    const intervalo = setInterval(verificarEstado, 5000);
    return () => clearInterval(intervalo);
  }, [procesamiento.sessionId]);

  // Manejar cambio de archivo
  const handleDocumentoChange = (docId, file) => {
    setDocumentos(prev => ({
      ...prev,
      [docId]: file
    }));
  };

  // Manejar eliminación de archivo
  const handleDocumentoRemove = (docId) => {
    setDocumentos(prev => {
      const newDocs = { ...prev };
      delete newDocs[docId];
      return newDocs;
    });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar que todos los documentos requeridos estén presentes
    const documentosFaltantes = DOCUMENTOS_REQUERIDOS
      .filter(doc => doc.isRequired && !documentos[doc.id])
      .map(doc => doc.nombre);

    if (documentosFaltantes.length > 0) {
      setMensaje({
        tipo: 'error',
        texto: `Faltan documentos requeridos: ${documentosFaltantes.join(', ')}`
      });
      return;
    }

    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // Preparar FormData
      const formData = new FormData();

      // Añadir archivos
      Object.entries(documentos).forEach(([docId, file]) => {
        formData.append('documentos', file);
      });

      // Añadir categorías
      formData.append('categorias', JSON.stringify(Object.keys(documentos)));

      // Añadir ID del socket si está disponible
      if (socket) {
        formData.append('socketId', socket.id);
      }

      // Configurar headers para el socketId
      const headers = socket ? { 'socket-id': socket.id } : {};

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
          estadosPorDocumento: Object.keys(documentos).reduce((acc, docId) => {
            acc[docId] = 'procesando';
            return acc;
          }, {})
        });

        setMensaje({
          tipo: 'info',
          texto: 'Procesando documentos. Esto puede tomar algunos minutos...'
        });
      } else {
        setMensaje({
          tipo: 'error',
          texto: response.data.message || 'Error al iniciar el procesamiento'
        });
      }
    } catch (error) {
      console.error('Error al enviar documentos:', error);

      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al procesar la solicitud'
      });
    } finally {
      setCargando(false);
    }
  };

  const resetearProceso = () => {
    // Resetear documentos subidos
    setDocumentos({});

    // Resetear estado de procesamiento
    setProcesamiento({
      sessionId: null,
      estado: null,
      progreso: 0,
      procesados: 0,
      total: 0,
      mensaje: '',
      estadosPorDocumento: {}
    });

    // Limpiar mensajes
    setMensaje({ tipo: '', texto: '' });

    // Resetear estado de carga
    setCargando(false);

    // Cualquier otra limpieza necesaria...
  };

  // Verificar si está en proceso
  const enProceso = procesamiento.estado === 'iniciando' || procesamiento.estado === 'en_proceso';

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
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

      {mensaje.texto && (
        <Alert
          color={mensaje.tipo === 'error' ? 'danger' : mensaje.tipo === 'info' ? 'info' : 'success'}
          className="mb-4"
        >
          {mensaje.texto}
        </Alert>
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
          {DOCUMENTOS_REQUERIDOS.map(docType => (
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
            disabled={enProceso || procesamiento.estado === 'completado'}
            className="text-red-600 hover:text-red-900 transition-colors bg-transparent"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className={`bg-emerald-600 text-white rounded-md ${cargando ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {cargando ? 'Enviando...' : 'Registrar Vehículo'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VehiculoDocumentUploader;