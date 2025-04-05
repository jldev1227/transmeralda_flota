import { StylesConfig } from "react-select";

export const selectStyles: StylesConfig = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#059669" : provided.borderColor,
    boxShadow: state.isFocused ? "0 0 0 1px #059669" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "#059669" : "#e2e8f0",
    },
    borderRadius: "0.375rem",
    padding: "2px",
    minHeight: "42px",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    borderRadius: "0.375rem",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#059669"
      : state.isFocused
        ? "#f0fdf4"
        : "white",
    color: state.isSelected ? "white" : "#111827",
    cursor: "pointer",
    "&:active": {
      backgroundColor: state.isSelected ? "#059669" : "#dcfce7",
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#dcfce7",
    borderRadius: "0.25rem",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#059669",
    fontWeight: 500,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#059669",
    "&:hover": {
      backgroundColor: "#059669",
      color: "white",
    },
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "#94a3b8",
    "&:hover": {
      color: "#059669",
    },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "#94a3b8",
    "&:hover": {
      color: "#ef4444",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#94a3b8",
  }),
};
