import React from "react";
import { FunctionAny } from "@shared/types/general";

export default function MinimalisticButton({ children, onClick, style, disabled }: { children?: React.ReactNode, onClick?: FunctionAny, style?: React.CSSProperties, disabled?: boolean }) {
  return (
    <button
      style={{
        border: "2px solid #fff",
        backgroundColor: "transparent",
        color: "white",
        borderRadius: '2rem',
        padding: '1.3rem',
        paddingTop: '0.5rem',
        paddingBottom: '0.5rem',
        fontSize: "1rem",
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
        ...style
      }}
      disabled={disabled}
      onClick={() => !disabled && (onClick&&onClick())}
    >
      {children}
    </button>
  );
}
