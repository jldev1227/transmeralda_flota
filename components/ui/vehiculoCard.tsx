import { Vehiculo } from '@/context/FlotaContext'
import { Card } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { CircleAlertIcon, ShieldCheckIcon, TriangleAlertIcon } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

export default function vehiculoCard({ item, onPress }: {
    item: Vehiculo,
    onPress: (id: string)=> void
}) {
    const getStatusColor = (estado: string | undefined): "success" | "danger" | "warning" | "default" | "primary" | "secondary" | undefined => {
        const statusColors: Record<string, "success" | "danger" | "warning" | "default" | "primary" | "secondary"> = {
            servicio: "success",
            disponible: "danger",
            mantenimiento: "warning",
            desvinculado: "danger",
        }
        return estado ? statusColors[estado.toLowerCase()] || "default" : "default"
    }

    type Documento = {
        fecha_vigencia?: string
        // otros campos si existen
    }

    const getIconByDocs = (documentos: Documento[] = []) => {
        if (!documentos.length) {
            return <CircleAlertIcon className="text-red-500" />
        }

        const now = new Date()
        let minDiff = Infinity

        documentos.forEach(doc => {
            if (doc.fecha_vigencia) {
                // Parse fecha_vigencia as UTC date
                const vigencia = new Date(doc.fecha_vigencia)
                // Only compare date part (ignore time)
                const diff = Math.ceil(
                    (vigencia.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
                )
                if (diff < minDiff) minDiff = diff
            }
        })

        if (minDiff < 0) {
            return <CircleAlertIcon className="text-red-500" />
        } else if (minDiff <= 30) {
            return <TriangleAlertIcon className="text-yellow-500" />
        } else {
            return <ShieldCheckIcon className="text-green-500" />
        }
    }

    return (
        <Card isPressable onPress={()=>onPress(item.id)} className="bg-white shadow-sm rounded-md relative select-none overflow-hidden h-60">
            <Image
                alt={`${item.placa.trim()} ${item.modelo?.trim()}`}
                className="h-56 w-56 mix-blend-multiply pointer-events-none select-none"
                src={`/assets/${item.clase_vehiculo?.toLowerCase().trim() === "camioneta" ? "car.jpg" : "bus.jpg"}`}
                height={500}
                width={500}
                priority
                style={{ transform: 'scaleX(-1) translateX(47px) translateY(-35px)', userSelect: 'none', pointerEvents: 'none' }}
                draggable={false}
            />
            <div
                className={`absolute w-32 h-32 -top-14 -right-16 rounded-l-full ${
                    (() => {
                        // Aplica el color igual en este div basado en los documentos
                        const now = new Date()
                        let minDiff = Infinity
                        item.documentos?.forEach((doc: any) => {
                            if (doc.fecha_vigencia) {
                                const vigencia = new Date(doc.fecha_vigencia)
                                const diff = Math.ceil(
                                    (vigencia.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
                                )
                                if (diff < minDiff) minDiff = diff
                            }
                        })
                        if (!item.documentos?.length || minDiff < 0) return 'bg-red-100'
                        if (minDiff <= 30) return 'bg-yellow-100'
                        return 'bg-green-100'
                    })()
                }`}
            >
                <div className='absolute top-20 right-6 w-20 h-20' style={{ transform: 'translateX(0px) translateY(-8px)'}}>
                    {getIconByDocs(item.documentos)}
                </div>
            </div>
            <div className='flex flex-col items-end gap-2 px-6' style={{ transform: 'translateY(-70px)' }}>
                <Chip variant="flat" color={getStatusColor(item.estado)} size="sm" className="capitalize px-2 py-1 text-xs font-medium">
                    {item.placa}
                </Chip>
                <div className='space-y-2'>
                    <p className='text-gray-400 text-right'>{item.marca} | {item.linea} | {item.modelo}</p>
                    <p className={`text-gray-400 truncate w-56 text-right${!item.propietario_nombre ? ' italic' : ''}`}>
                        {item.propietario_nombre ? item.propietario_nombre : "Sin propietario"}
                    </p>
                </div>
            </div>
        </Card>
    )
}
