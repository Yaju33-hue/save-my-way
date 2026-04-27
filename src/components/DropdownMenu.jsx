import React from "react";

export default function DropdownMenu({ isOpen, onClose, onEdit, onDelete }) {
  return (
    <div className={`dropdown-menu ${isOpen ? "open" : ""}`}>
      <button
        className="dropdown-item edit-item"
        onClick={() => {
          onEdit();
          onClose();
        }}
      >
        Edit
      </button>

      <button
        className="dropdown-item delete-item"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Delete
      </button>
    </div>
  );
}
