import React from "react";
import { STATUS_COLOR } from "../constants.js";

export default function StampBadge({ status }) {
  const color = STATUS_COLOR[status] || STATUS_COLOR.Pending;
  return (
    <span className="stamp" style={{ color }}>
      {status}
    </span>
  );
}
