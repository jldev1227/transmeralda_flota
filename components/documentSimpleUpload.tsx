"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { DatePicker } from "@heroui/date-picker";
import { Upload, FileText, XCircle, Calendar, Download } from "lucide-react";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { apiClient } from "@/config/apiClient";
import { Documento } from "@/context/FlotaContext";


// Formatter para fechas en español
const formatter = new Intl.DateTimeFormat('es-ES', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});


// ✅ Interfaz para documentos existentes
interface DocumentoExistente {
  id: string;
  categoria: string;
  nombre_original: string;
  fecha_vigencia: string | null;
  estado: string;
  s3_key: string;
  tamaño: number;
  upload_date: string;
}

interface SimpleDocumentUploaderProps {
  documentKey: string;
  label: string;
  required?: boolean;
  vigencia?: boolean;
  file?: File | null;
  fecha_vigencia?: Date | null;
  onChange?: (documentKey: string, file: File, fecha_vigencia?: Date) => void;
  onRemove?: (documentKey: string) => void;
  disabled?: boolean;
  errores?: Record<string, boolean>;
  // ✅ Nuevas props para documentos existentes
  existingDocument?: DocumentoExistente | null;
  isExisting?: boolean;
}

const SimpleDocumentUploader = ({
  documentKey,
  label,
  required = false,
  vigencia = false,
  file = null,
  fecha_vigencia = null,
  onChange,
  onRemove,
  disabled = false,
  errores = {},
  // ✅ Nuevas props
  existingDocument = null,
  isExisting = false,
}: SimpleDocumentUploaderProps) => {

  const [isDragging, setIsDragging] = useState(false);
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Inicializar fecha desde documento existente o fecha_vigencia prop
  useEffect(() => {
    if (fecha_vigencia) {
      const date = new Date(fecha_vigencia);
      setSelectedDate(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()));
    } else if (existingDocument?.fecha_vigencia) {
      const date = new Date(existingDocument.fecha_vigencia);
      setSelectedDate(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()));
    }
  }, [fecha_vigencia, existingDocument]);

  // Convertir CalendarDate a Date
  const calendarDateToDate = (calendarDate: CalendarDate | null): Date | null => {
    if (!calendarDate) return null;
    return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
  };

  // Manejar cambios de fecha y actualizar el archivo si existe
  useEffect(() => {
    if (file && selectedDate) {
      const dateValue = calendarDateToDate(selectedDate);
      onChange?.(documentKey, file, dateValue || undefined);
    }
  }, [selectedDate, file, documentKey]);

  // Manejar drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFile = e.dataTransfer.files[0];
      const dateValue = calendarDateToDate(selectedDate);
      onChange?.(documentKey, newFile, dateValue || undefined);
    }
  };

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.target.files && e.target.files.length > 0) {
      const newFile = e.target.files[0];
      const dateValue = calendarDateToDate(selectedDate);
      onChange?.(documentKey, newFile, dateValue || undefined);
    }
  };

  // Manejar eliminación
  const handleRemove = () => {
    if (disabled) return;
    
    setSelectedDate(null);
    onRemove?.(documentKey);
    
    // Limpiar el input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Formatear tamaño del archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // ✅ Determinar qué mostrar: archivo nuevo o documento existente
  const hasContent = file || existingDocument;
  const displayName = file ? file.name : existingDocument?.nombre_original || "";
  const displaySize = file ? file.size : existingDocument?.tamaño || 0;

  // OPCIÓN 3: Descarga con fetch a través del backend
    const handleDownload = async (documento: Documento | DocumentoExistente) => {
      try {
        const response = await apiClient.get(`/api/documentos/descargar/${documento.id}`, {
          responseType: 'blob',
          timeout: 30000, // 30 segundos
        });
  
        if (!response.data) {
          throw new Error("No se recibieron datos del servidor");
        }
  
        // Crear blob y descargar
        const blob = new Blob([response.data], {
          type: response.headers['content-type'] || 'application/octet-stream'
        });
  
        const blobUrl = window.URL.createObjectURL(blob);
  
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = documento.nombre_original;
        link.style.display = 'none';
  
        document.body.appendChild(link);
        link.click();
  
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
  
      } catch (error) {
        console.error("❌ Error al descargar documento:", error);
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? (error as { message: string }).message
            : "Error desconocido";
        alert(`Error al descargar "${documento.nombre_original}": ${errorMessage}`);
      }
    };

  return (
    <div className="border border-gray-300 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h4>
        
        {hasContent && (
          <div className="flex items-center gap-2">
            {isExisting && !file && (
              <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <FileText className="h-4 w-4 mr-1" />
                Documento existente
              </div>
            )}
            {file && (
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                <FileText className="h-4 w-4 mr-1" />
                Nuevo archivo
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Area o File Preview */}
      {!hasContent ? (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragging 
              ? "border-blue-400 bg-blue-50" 
              : "border-gray-300 hover:border-gray-400"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
          `}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            disabled={disabled}
            onChange={handleFileChange}
          />
          
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium mb-1">
            {isDragging ? "Suelta el archivo aquí" : "Arrastra y suelta o haz clic"}
          </p>
          <p className="text-sm text-gray-500">
            PDF, JPG o PNG (Máx. 10MB)
          </p>
        </div>
      ) : (
        /* File Preview */
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <FileText className={`h-5 w-5 mr-3 ${file ? 'text-green-600' : 'text-blue-600'}`} />
              <div>
                <p className="font-medium text-gray-900 text-sm">{displayName}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatFileSize(displaySize)}</span>
                  {existingDocument && (
                    <span>• Subido: {new Date(existingDocument.upload_date).toLocaleDateString('es-ES')}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* ✅ Botón de descarga para documentos existentes */}
              {existingDocument && !file && (
                <Button
                  size="sm"
                  variant="light"
                  color="primary"
                  onPress={()=>handleDownload(existingDocument)}
                  className="min-w-0 px-2"
                  title="Descargar documento"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              
              {/* Botón para reemplazar archivo existente */}
              {existingDocument && !disabled && (
                <Button
                  size="sm"
                  variant="light"
                  color="secondary"
                  onPress={() => fileInputRef.current?.click()}
                  className="min-w-0 px-2"
                  title="Reemplazar archivo"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}
              
              {/* Botón de eliminación */}
              {!disabled && (
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={handleRemove}
                  className="min-w-0 px-2"
                  title="Eliminar"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Input oculto para reemplazar archivos */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            disabled={disabled}
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Date Picker para vigencia */}
      {vigencia && (
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4 mr-2" />
            Fecha de vigencia
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          <DatePicker
            value={selectedDate}
            isInvalid={errores[documentKey]}
            errorMessage={errores[documentKey] ? "Este campo es obligatorio" : undefined}
            onChange={setSelectedDate}
            isDisabled={disabled}
            label="Seleccionar fecha de vigencia"
            className="w-full"
            size="sm"
          />
          
          {selectedDate && (
            <p className="text-xs text-gray-500">
              Vigente hasta: {selectedDate ? formatter.format(selectedDate.toDate(getLocalTimeZone())) : "--"}
            </p>
          )}
          
          {/* ✅ Mostrar fecha de vigencia actual del documento existente */}
          {existingDocument?.fecha_vigencia && !selectedDate && (
            <p className="text-xs text-blue-600">
              Vigencia actual: {new Date(existingDocument.fecha_vigencia).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleDocumentUploader;