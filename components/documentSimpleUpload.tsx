"use client";

import React, { useState, useRef } from "react";
import { Button } from "@heroui/button";
import { DatePicker } from "@heroui/date-picker";
import { Upload, FileText, XCircle, Calendar } from "lucide-react";

interface SimpleDocumentUploaderProps {
  key: string;
  label: string;
  required?: boolean;
  vigencia?: boolean;
  file?: File | null;
  fechaVigencia?: Date | null;
  onChange?: (key: string, file: File, fechaVigencia?: Date) => void;
  onRemove?: (key: string) => void;
  disabled?: boolean;
}

const SimpleDocumentUploader = ({
  key: docKey,
  label,
  required = false,
  vigencia = false,
  file = null,
  fechaVigencia = null,
  onChange,
  onRemove,
  disabled = false,
}: SimpleDocumentUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(fechaVigencia);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onChange?.(docKey, newFile, selectedDate || undefined);
    }
  };

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.target.files && e.target.files.length > 0) {
      const newFile = e.target.files[0];
      onChange?.(docKey, newFile, selectedDate || undefined);
    }
  };

  // Manejar cambio de fecha
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (file) {
      onChange?.(docKey, file, date || undefined);
    }
  };

  // Manejar eliminación
  const handleRemove = () => {
    if (disabled) return;
    
    setSelectedDate(null);
    onRemove?.(docKey);
    
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

  return (
    <div className="border border-gray-300 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h4>
        
        {file && (
          <div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
            <FileText className="h-4 w-4 mr-1" />
            Archivo cargado
          </div>
        )}
      </div>

      {/* Upload Area */}
      {!file ? (
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
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900 text-sm">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          
          {!disabled && (
            <Button
              size="sm"
              variant="light"
              color="danger"
              onPress={handleRemove}
              className="min-w-0 px-2"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
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
            onChange={handleDateChange}
            disabled={disabled}
            placeholder="Seleccionar fecha de vigencia"
            className="w-full"
            size="sm"
          />
          
          {selectedDate && (
            <p className="text-xs text-gray-500">
              Vigente hasta: {selectedDate.toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleDocumentUploader;