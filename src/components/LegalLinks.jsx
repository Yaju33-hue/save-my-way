import React from "react";
import { Link } from "react-router-dom";

export default function LegalLinks() {
  return (
    <nav className="legal-links" aria-label="Legal information">
      <Link to="/privacy">Privacy</Link>
      <Link to="/terms">Terms</Link>
    </nav>
  );
}