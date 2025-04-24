import React from "react";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FileQuestion,
} from "lucide-react";

import { Vehiculo } from "@/context/FlotaContext";

interface VehiculoCardProps {
  vehiculo: Vehiculo;
  onPress: (id: string) => void;
}

export default function VehiculoCard({ vehiculo, onPress }: VehiculoCardProps) {
  const isCamioneta = vehiculo.claseVehiculo === "CAMIONETA";

  // Función para obtener todos los documentos clasificados
  const getDocumentStatus = (vehicle: Vehiculo) => {
    // Definir todos los documentos requeridos
    const requiredDocs = [
      { name: "SOAT", date: vehicle.soatVencimiento },
      { name: "Técnicomecánica", date: vehicle.tecnomecanicaVencimiento },
      {
        name: "Tarjeta de Operación",
        date: vehicle.tarjetaDeOperacionVencimiento,
      },
      {
        name: "Póliza Contractual",
        date: vehicle.polizaContractualVencimiento,
      },
      {
        name: "Póliza Extracontractual",
        date: vehicle.polizaExtraContractualVencimiento,
      },
      { name: "Póliza Todo Riesgo", date: vehicle.polizaTodoRiesgoVencimiento },
    ];

    // Todos los documentos con su estado
    const allDocs = requiredDocs.map((doc) => ({
      ...doc,
      status: doc.date ? checkDocumentStatus(doc.date) : "NA",
      date: doc.date ? new Date(doc.date) : null,
    }));

    // Separar por estado
    const pendientes = allDocs.filter((doc) => doc.status === "NA");
    const vencidos = allDocs.filter((doc) => doc.status === "VENCIDO");
    const proximos = allDocs.filter((doc) => doc.status === "PRÓXIMO");
    const vigentes = allDocs.filter((doc) => doc.status === "VIGENTE");

    // Ordenar los que tienen fecha por proximidad
    vencidos.sort(
      (a, b) => (a.date as Date).getTime() - (b.date as Date).getTime(),
    );
    proximos.sort(
      (a, b) => (a.date as Date).getTime() - (b.date as Date).getTime(),
    );
    vigentes.sort(
      (a, b) => (a.date as Date).getTime() - (b.date as Date).getTime(),
    );

    // Determinar el documento de mayor prioridad
    // 1. Pendientes (NA), 2. Vencidos, 3. Próximos, 4. Vigentes
    const priorityDoc =
      pendientes.length > 0
        ? pendientes[0]
        : vencidos.length > 0
          ? vencidos[0]
          : proximos.length > 0
            ? proximos[0]
            : vigentes.length > 0
              ? vigentes[0]
              : null;

    return {
      allDocs,
      pendientes,
      vencidos,
      proximos,
      vigentes,
      priorityDoc,
    };
  };

  // Función para verificar el estado de documentos
  const checkDocumentStatus = (date: string) => {
    if (!date) return "NA";
    const today = new Date();
    const expiryDate = new Date(date);
    const thirtyDaysFromNow = new Date();

    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (expiryDate < today) {
      return "VENCIDO";
    } else if (expiryDate <= thirtyDaysFromNow) {
      return "PRÓXIMO";
    } else {
      return "VIGENTE";
    }
  };

  // Obtener el estado de los documentos
  const docStatus = getDocumentStatus(vehiculo);

  // Determinar qué icono mostrar según el estado del documento prioritario
  const getStatusIcon = () => {
    if (!docStatus.priorityDoc) return null;

    switch (docStatus.priorityDoc.status) {
      case "NA":
        return <FileQuestion className="text-gray-500" size={20} />;
      case "VENCIDO":
        return <AlertCircle className="text-red-500" size={20} />;
      case "PRÓXIMO":
        return <AlertTriangle className="text-amber-500" size={20} />;
      case "VIGENTE":
        return <CheckCircle className="text-green-500" size={20} />;
      default:
        return null;
    }
  };

  // Determinar qué icono mostrar según el estado del documento prioritario
  const getStatusColor = (estado: string) => {
    if (!estado) return null;

    switch (estado) {
      case "DISPONIBLE":
        return "text-emerald-500";
      case "NO DISPONIBLE":
        return "text-red-500";
      case "MANTENIMIENTO":
        return "text-primary-500";
      case "INACTIVO":
        return "text-gray-500";
      default:
        return null;
    }
  };

  // Texto de estado para el icono
  const getStatusText = () => {
    if (!docStatus.priorityDoc) return "";

    if (docStatus.priorityDoc.status === "NA") {
      return `${docStatus.priorityDoc.name} pendiente`;
    } else if (docStatus.priorityDoc.status === "VENCIDO") {
      return `${docStatus.priorityDoc.name} vencido`;
    } else if (docStatus.priorityDoc.status === "PRÓXIMO") {
      return `${docStatus.priorityDoc.name} próximo a vencer`;
    }

    return "";
  };

  return (
    <Card
      isPressable
      className="h-full flex flex-col"
      radius="sm"
      shadow="sm"
      onPress={() => onPress(vehiculo.id)}
    >
      <CardHeader className="font-semibold text-emerald-600 flex justify-between items-center">
        <div className="flex items-center gap-2">{vehiculo.placa}</div>
        <div className="flex items-center gap-2 text-xs font-normal text-gray-500">
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </CardHeader>
      <CardBody className="flex flex-row justify-around">
        <div className="mb-4">
          <Image
            priority
            alt={`${vehiculo.claseVehiculo} ${vehiculo.placa}`}
            className="scale-x-[-1]"
            height={200}
            src={`/assets/${isCamioneta ? "car" : "bus"}.jpg`}
            width={200}
          />
        </div>

        <div className="text-sm space-y-2">
          <div>
            <p className="text-gray-500">Marca:</p>
            <p className="text-gray-800 font-medium">{vehiculo.marca}</p>
          </div>
          <div>
            <p className="text-gray-500">Línea:</p>
            <p className="text-gray-800 font-medium">{vehiculo.linea}</p>
          </div>
          <div>
            <p className="text-gray-500">Modelo:</p>
            <p className="text-gray-800 font-medium">{vehiculo.modelo}</p>
          </div>
          <div>
            <p className="text-gray-500">Estado:</p>
            <p className={`font-medium ${getStatusColor(vehiculo.estado)}`}>
              {vehiculo.estado}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Kilometraje:</p>
            <p className="text-gray-800 font-medium">
              {vehiculo.kilometraje.toLocaleString()} km
            </p>
          </div>
        </div>
      </CardBody>
      <Divider />
      <CardFooter className="flex justify-between items-center">
        <p className="text-gray-800 text-sm">{vehiculo.tipoCarroceria}</p>
        <p className="text-gray-500 text-xs">{vehiculo.color}</p>
      </CardFooter>
    </Card>
  );
}
