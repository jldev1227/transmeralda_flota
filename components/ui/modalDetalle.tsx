import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Edit, Download } from "lucide-react";

import { Vehiculo } from "@/context/FlotaContext";

interface ModalDetalleConductorProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculo: Vehiculo | null;
  onEdit?: () => void;
}

const ModalDetalleConductor: React.FC<ModalDetalleConductorProps> = ({
  isOpen,
  onClose,
  vehiculo,
  onEdit,
}) => {
  if (!vehiculo) return null;

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="4xl" onClose={onClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between" />

            <ModalBody />

            <ModalFooter>
              <div className="flex space-x-2">
                <Button
                  color="primary"
                  radius="sm"
                  variant="light"
                  onPress={onClose}
                >
                  Cerrar
                </Button>

                {/* Botón para descargar información (opcional) */}
                <Button
                  color="secondary"
                  radius="sm"
                  startContent={<Download className="h-4 w-4" />}
                  variant="flat"
                  onPress={() => {
                    // Lógica para descargar información del vehiculo (PDF, CSV, etc.)
                    alert(
                      "Funcionalidad para descargar información del vehiculo",
                    );
                  }}
                >
                  Descargar Info
                </Button>

                {/* Botón de editar (opcional) */}
                {onEdit && (
                  <Button
                    color="primary"
                    radius="sm"
                    startContent={<Edit className="h-4 w-4" />}
                    variant="solid"
                    onPress={onEdit}
                  >
                    Editar Conductor
                  </Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalDetalleConductor;
