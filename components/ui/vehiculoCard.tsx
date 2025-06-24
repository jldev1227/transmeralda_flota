import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
  CircleAlertIcon,
  CircleCheck,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Image from "next/image";
import React from "react";

import { DOCUMENTOS_REQUERIDOS } from "../documentUpload";

import { Vehiculo } from "@/context/FlotaContext";

export default function vehiculoCard({
  item,
  onPress,
  isSelect,
  onSelect,
  selectedIds,
}: {
  item: Vehiculo;
  onPress: (id: string) => void;
  isSelect: boolean;
  onSelect: (id: string) => void;
  selectedIds: string[];
}) {
  const getStatusColor = (
    estado: string | undefined,
  ):
    | "success"
    | "danger"
    | "warning"
    | "default"
    | "primary"
    | "secondary"
    | undefined => {
    const statusColors: Record<
      string,
      "success" | "danger" | "warning" | "default" | "primary" | "secondary"
    > = {
      servicio: "success",
      disponible: "danger",
      mantenimiento: "warning",
      desvinculado: "danger",
    };

    return estado ? statusColors[estado.toLowerCase()] || "default" : "default";
  };

  type Documento = {
    fecha_vigencia?: string;
    // otros campos si existen
  };

  const getIconByDocs = (documentos: Documento[] = []) => {
    // Verifica si faltan documentos requeridos
    const documentosPresentes = documentos.map(
      (doc: any) => doc.tipo || doc.categoria || doc.nombre || doc.key,
    );
    const faltanRequeridos = DOCUMENTOS_REQUERIDOS.some(
      (req: { id: string; nombre: string; isRequired: boolean }) =>
        !documentosPresentes.includes(req.id),
    );

    if (!documentos.length || faltanRequeridos) {
      return <CircleAlertIcon className="text-red-500" />;
    }

    const now = new Date();
    let minDiff = Infinity;

    documentos.forEach((doc) => {
      if (doc.fecha_vigencia) {
        const vigencia = new Date(doc.fecha_vigencia);
        const diff = Math.ceil(
          (vigencia.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) /
            (1000 * 60 * 60 * 24),
        );

        if (diff < minDiff) minDiff = diff;
      }
    });

    if (minDiff < 0) {
      return <CircleAlertIcon className="text-red-500" />;
    } else if (minDiff <= 30) {
      return <TriangleAlertIcon className="text-yellow-500" />;
    } else {
      return <ShieldCheckIcon className="text-green-500" />;
    }
  };

  const handlePress = () => {
    if (isSelect) {
      onSelect(item.id);
    } else {
      onPress(item.id);
    }
  };

  return (
    <Card
      isPressable
      className={`${isSelect && selectedIds.includes(item.id) ? "border-2 border-primary-300 !bg-primary-50/20" : ""} bg-white shadow-sm rounded-md relative select-none overflow-hidden h-60`}
      onPress={handlePress}
    >
      {isSelect && selectedIds.includes(item.id) && (
        <div className="absolute p-1 rounded-fullz-10 bottom-2 left-2">
          <CircleCheck className="text-primary" />
        </div>
      )}
      <Image
        priority
        alt={`${item.placa.trim()} ${item.modelo?.trim()}`}
        className="h-56 w-56 mix-blend-multiply pointer-events-none select-none"
        draggable={false}
        height={500}
        src={`/assets/${item.clase_vehiculo?.toLowerCase().trim() === "camioneta" ? "car.jpg" : "bus.jpg"}`}
        style={{
          transform: "scaleX(-1) translateX(47px) translateY(-35px)",
          userSelect: "none",
          pointerEvents: "none",
        }}
        width={500}
      />
      <div
        className={`absolute w-32 h-32 -top-14 -right-16 rounded-l-full ${(() => {
          // Aplica el color igual en este div basado en los documentos requeridos
          const documentosPresentes =
            item.documentos?.map(
              (doc: any) => doc.tipo || doc.categoria || doc.nombre || doc.key,
            ) || [];
          const faltanRequeridos = DOCUMENTOS_REQUERIDOS.some(
            (req: { id: string; nombre: string; isRequired: boolean }) =>
              !documentosPresentes.includes(req.id),
          );

          if (!item.documentos?.length || faltanRequeridos) return "bg-red-100";

          const now = new Date();
          let minDiff = Infinity;

          item.documentos.forEach((doc: any) => {
            if (doc.fecha_vigencia) {
              const vigencia = new Date(doc.fecha_vigencia);
              const diff = Math.ceil(
                (vigencia.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) /
                  (1000 * 60 * 60 * 24),
              );

              if (diff < minDiff) minDiff = diff;
            }
          });
          if (minDiff < 0) return "bg-red-100";
          if (minDiff <= 30) return "bg-yellow-100";

          return "bg-green-100";
        })()}`}
      >
        <div
          className="absolute top-20 right-6 w-20 h-20"
          style={{ transform: "translateX(0px) translateY(-8px)" }}
        >
          {getIconByDocs(item.documentos)}
        </div>
      </div>
      <div
        className="flex flex-col items-end gap-2 px-6"
        style={{ transform: "translateY(-70px)" }}
      >
        <Chip
          className="capitalize px-2 py-1 text-xs font-medium"
          color={getStatusColor(item.estado)}
          size="sm"
          variant="flat"
        >
          {item.placa}
        </Chip>
        <div className="space-y-2">
          <p className="text-gray-400 text-right">
            {item.marca} | {item.linea} | {item.modelo}
          </p>
          <p
            className={`text-gray-400 truncate w-48 text-right${!item.propietario_nombre ? " italic" : ""}`}
          >
            {item.propietario_nombre
              ? item.propietario_nombre
              : "Sin propietario"}
          </p>
        </div>
      </div>
    </Card>
  );
}
