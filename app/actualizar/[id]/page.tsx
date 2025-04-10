"use client"

import React, { useCallback, useEffect, useState } from 'react'
import DocumentUploadForm from '@/components/documentUpload';
import { Button } from '@heroui/button';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useFlota } from '@/context/FlotaContext';

export default function page() {
  const router = useRouter();
  const { obtenerVehiculoBasico } = useFlota()
  const params = useParams<{ tag: string; item: string; id: string }>()
  const { id } = params;
  const [vehiculo, setVehiculo] = useState<any>(null);

  const obtenerInfoVehiculo = useCallback(async () => {
    if (id) {
      try {
        const infoVehiculo = await obtenerVehiculoBasico(id);
        setVehiculo(infoVehiculo);
      } catch (error) {
        console.error("Error al obtener información del vehículo:", error);
      }
    }
  }, [id]); // Usar 'id' en lugar de 'params.id'
  
  // Ejecutar la función en un useEffect
  useEffect(() => {
    obtenerInfoVehiculo();
  }, [obtenerInfoVehiculo]);

  return (
    <div className="flex-grow px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-between gap-4">
          <h1 className="text-xl font-bold">Actualizacion de Vehículo - {vehiculo?.placa}</h1>
          <Button color='primary' className='rounded-md' onPress={() => router.back()}>
            <ArrowLeft height={18} />
            Volver
          </Button>
        </div>
        {/* Documentos del vehículo */}
        <div className="bg-white shadow-sm rounded-lg mb-6 border border-gray-100">
          <div className="p-4">
            <DocumentUploadForm id={id}/>
          </div>
        </div>
      </div>
    </div>
  )
}
