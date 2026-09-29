import React, { useEffect, useState } from "react";
import { useReactor } from "sia-reactor/adapters/react";
import { store } from "../store/index.js";
import { FaUser } from "react-icons/fa";

export default function ProfileAvatar({
  className = "",
  imageOverride,
  positionOverride,
  accessibleLabel,
}) {
  const state = useReactor(store);
  const image = imageOverride ?? state.auth.user?.profileImage ?? "";
  const position = positionOverride ?? state.auth.user?.profileImagePosition ?? { x: 50, y: 50 };
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
          style={{ objectPosition: `${position.x}% ${position.y}%` }}
        />
      ) : (
        <FaUser />
      )}
    </span>
  );
}