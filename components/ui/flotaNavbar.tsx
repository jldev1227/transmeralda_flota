import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { ChevronDown } from "lucide-react";

import { formatDate } from "@/helpers";

interface CompactNavbarProps {
  user: {
    nombre: string;
    correo: string;
    ultimo_acceso: string;
  };
  LogoutButton: React.ComponentType<{ children: React.ReactNode }>;
}

// Versión con dropdown para información adicional
const FlotaNavBar: React.FC<CompactNavbarProps> = ({ user, LogoutButton }) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container mx-auto bg-white border-b border-gray-100 px-10 py-4">
      <div className="flex items-center justify-between">
        {/* Usuario con dropdown */}
        <Dropdown>
          <DropdownTrigger>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1 transition-colors">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold">
                {getInitials(user.nombre)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-emerald-700">
                  {user.nombre}
                </p>
                <p className="text-xs text-gray-500">{user.correo}</p>
              </div>
              <ChevronDown className="text-gray-400" size={14} />
            </div>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Información del usuario"
            className="min-w-[250px]"
          >
            <DropdownItem key="profile" className="gap-2">
              <div>
                <p className="font-medium">{user.nombre}</p>
                <p className="text-small text-gray-500">{user.correo}</p>
                <p className="text-tiny text-gray-400 mt-1">
                  Último acceso: {formatDate(user.ultimo_acceso)}
                </p>
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        {/* Logout */}
        <LogoutButton>Cerrar sesión</LogoutButton>
      </div>
    </div>
  );
};

export default FlotaNavBar;
