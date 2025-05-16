import React, { useEffect, useState } from "react";
import { Vehiculo } from "@/context/FlotaContext";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { SaveIcon, TruckIcon } from "lucide-react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

interface ModalFormVehiculoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehiculo: Vehiculo) => Promise<void>;
  vehiculoEditar?: Vehiculo | null;
  titulo?: string;
}

type VehiculoKey = keyof Vehiculo;

const ModalFormVehiculo: React.FC<ModalFormVehiculoProps> = ({
  isOpen,
  onClose,
  onSave,
  vehiculoEditar = null,
  titulo = "Registrar Nuevo Vehículo",
}) => {

  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState<Partial<Vehiculo>>({
    placa: "",
    marca: "",
    clase_vehiculo: "",
    color: "",
    modelo: "",
    linea: "",
  });

  // Estado para manejar la validación
  const [errores, setErrores] = useState<Record<string, boolean>>({
    placa: false,
    marca: false,
    clase_vehiculo: false,
    modelo: false,
    linea: false,
  });

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      placa: "",
      marca: "",
      clase_vehiculo: "",
      color: "",
      modelo: "",
      linea: "",
    });
    setErrores({
      placa: false,
      marca: false,
      clase_vehiculo: false,
      modelo: false,
      linea: false,
    });
  };

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error al escribir
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  // Manejar cambios en los selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error al seleccionar
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  // Validar y guardar datos
  const handleSave = () => {
    // Campos requeridos para todos los vehículos
    const camposRequeridos: VehiculoKey[] = [
      "placa",
      "marca",
      "clase_vehiculo",
      "modelo",
      "linea",
    ];

    // Validar campos requeridos
    const nuevosErrores: Record<string, boolean> = {};

    camposRequeridos.forEach((campo) => {
      if (!formData[campo]) {
        nuevosErrores[campo] = true;
      }
    });

    setErrores(nuevosErrores);

    // Si hay errores, no continuar
    if (Object.values(nuevosErrores).some((error) => error)) {
      return;
    }

    // Enviar datos
    onSave(formData as Vehiculo);
  };

  const clasesVehiculo = [
    { key: "camioneta", label: "Camioneta" },
    { key: "bus", label: "Bus" },
    { key: "microbus", label: "Microbús" },
  ];

    // Efecto para cargar datos cuando se está editando
  useEffect(() => {
    if (vehiculoEditar) {
      setFormData({
        ...vehiculoEditar,
      });

    } else {
      // Resetear el formulario si no hay conductor para editar
      resetForm();
    }
  }, [vehiculoEditar, isOpen]);

  return (
    <Modal
      backdrop={"blur"}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onClose={onClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center space-x-2">
                <TruckIcon className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold">
                  {vehiculoEditar ? "Editar Vehículo" : titulo}
                </h3>
              </div>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-6">
                <div className="border p-4 rounded-md">
                  <h4 className="text-md font-semibold mb-4 border-b pb-2">
                    Información Básica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      isRequired
                      errorMessage={
                        errores.placa ? "La placa es requerida" : ""
                      }
                      isInvalid={errores.placa}
                      label="Placa"
                      name="placa"
                      placeholder="Ingrese placa"
                      value={formData.placa || ""}
                      onChange={handleChange}
                    />

                    <Input
                      isRequired
                      errorMessage={
                        errores.marca ? "La marca es requerida" : ""
                      }
                      isInvalid={errores.marca}
                      label="Marca"
                      name="marca"
                      placeholder="Ingrese marca"
                      value={formData.marca || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Select
                      label="Clase de Vehículo"
                      name="clase_vehiculo"
                      placeholder="Seleccione una clase"
                      onChange={(e) => handleSelectChange("clase_vehiculo", e.target.value)}
                    >
                      {clasesVehiculo.map((clase) => (
                        <SelectItem key={clase.key} textValue={clase.label}>
                          {clase.label}
                        </SelectItem>
                      ))}
                    </Select>

                    {/* Color */}
                    <Input
                      label="Color"
                      name="color"
                      placeholder="Ingrese color del vehículo"
                      value={formData.color || ""}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Campos para línea y modelo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Input
                      isRequired
                      errorMessage={
                        errores.linea ? "La línea es requerida" : ""
                      }
                      isInvalid={errores.linea}
                      label="Línea"
                      name="linea"
                      placeholder="Ingrese línea del vehículo (ej. Hilux, Corolla)"
                      value={formData.linea || ""}
                      onChange={handleChange}
                    />

                    <Input
                      isRequired
                      errorMessage={
                        errores.modelo ? "El modelo es requerido" : ""
                      }
                      isInvalid={errores.modelo}
                      label="Modelo (Año)"
                      name="modelo"
                      placeholder="Ingrese modelo/año del vehículo"
                      value={formData.modelo || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                color="danger"
                radius="sm"
                variant="light"
                onPress={onClose}
              >
                Cancelar
              </Button>
              <Button
                className="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                startContent={<SaveIcon className="h-4 w-4" />}
                onPress={handleSave}
              >
                {vehiculoEditar ? "Actualizar" : "Guardar"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalFormVehiculo;