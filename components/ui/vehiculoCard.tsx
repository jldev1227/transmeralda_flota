import { Vehiculo } from '@/context/FlotaContext'
import { Chip } from '@heroui/chip'
import Image from 'next/image'
import React from 'react'

export default function vehiculoCard({ item }: {
    item: Vehiculo
}) {
    return (
        <div className="bg-white shadow-sm rounded-md relative select-none overflow-hidden">
            <Image
                alt={`${item.placa.trim()} ${item.modelo?.trim()}`}
                className="h-56 w-56 mix-blend-multiply pointer-events-none select-none"
                src={`/assets/${item.clase_vehiculo?.toLowerCase().trim() === "camioneta" ? "car.jpg" : "bus.jpg"}`}
                height={400}
                width={400}
                style={{ transform: 'scaleX(-1) translateX(50px) translateY(-45px)', userSelect: 'none', pointerEvents: 'none' }}
                draggable={false}
            />
            <div className='flex flex-col items-end gap-2 px-4'>
                <Chip size='sm'>{item.estado}</Chip>
                <div className='space-y-2'>
                    <p className='text-right'>{item.marca} | {item.linea} | {item.modelo}</p>
                    <p className="truncate w-48 text-right">{item.propietario_nombre}</p>
                </div>
            </div>
        </div>
    )
}
