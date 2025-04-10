"use client"

import DocumentUploadForm from '@/components/documentUpload';
import { Button } from '@heroui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Page(){
    const router = useRouter();

    return (
        <div className="flex-grow px-6 py-8">
            <div className="max-w-7xl mx-auto space-y-4">
                <div className="flex justify-between gap-4">
                    <h1 className="text-xl font-bold">Registro de Nuevo Vehículo</h1>
                    <Button color='primary' className='rounded-md' onPress={() => router.back()}>
                        <ArrowLeft height={18} />
                        Volver
                    </Button>
                </div>
                {/* Documentos del vehículo */}
                <div className="bg-white shadow-sm rounded-lg mb-6 border border-gray-100">
                    <div className="p-4">
                        <DocumentUploadForm/>
                    </div>
                </div>
            </div>
        </div>
    );
};
