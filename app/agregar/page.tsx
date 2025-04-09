"use client"

import React, { useState } from 'react';
import {
    Button,
} from "@heroui/button";
import DocumentUploadForm from '@/components/documentUpload';
import { Card } from '@heroui/card';
import { ArrowLeft } from 'lucide-react';
import { Alert } from '@heroui/alert';

const NuevoVehiculoPage = () => {


    return (
        <div className="container mx-auto py-6">
            <h1 className="font-bold mb-6">Registro de Nuevo Vehículo</h1>
            <div>
                <div>
                    {/* Documentos del vehículo */}
                    <Card>
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3>Documentos del Vehículo</h3>
                            <Button color='primary' className='rounded-md'>
                                <ArrowLeft height={18} />
                                Volver
                            </Button>
                        </div>
                        <div className="p-4">
                            <DocumentUploadForm
                                onSubmit={()=>console.log("ASas")}
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NuevoVehiculoPage;