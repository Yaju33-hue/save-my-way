import React, { useEffect, useState } from "react";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { FaUser } from "react-icons/fa";

export default function ProfileAvatar({
  className = "",
  accessibleLabel,
}) {
  const state = useReactor(store);
  const image = state.auth.user?.profileImage || "";
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <span
      className={`profile-avatar ${className}`}
      aria-hidden={accessibleLabel ? undefined : "true"}
      role={accessibleLabel ? "img" : undefined}
      aria-label={accessibleLabel}
    >
      {image && !imageFailed ? (
        <img
          src={image}
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : (
        <FaUser />
      )}
    </span>
  );
}