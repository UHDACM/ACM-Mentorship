import { FunctionAny } from "@shared/types/general";

export function SaveButtonFixed({
  show = false,
  saving,
  onSave,
  onReset,
  disabled = true,
}: {
  show?: boolean;
  onSave?: FunctionAny;
  onReset?: FunctionAny;
  saving?: boolean;
  disabled?: boolean;
}) {
  if (!show || disabled) {
    return;
  }
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        bottom: 0,
        width: "100vw",
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: "90vw",
          width: "27rem",
          backgroundColor: "#333",
          display: "flex",
          alignItems: "center",
          marginLeft: 10,
          marginBottom: 10,
          padding: 8,
          borderRadius: 10,
          border: "1px solid #fff4",
        }}
      >
        <button
          disabled={saving}
          style={{
            backgroundColor: "#26610E",
            color: "#ddd",
            fontSize: "1rem",
            opacity: saving ? 0.5 : 1,
          }}
          onClick={onSave}
        >
          {!saving ? "Save" : "Saving..."}
        </button>
        <button
          onClick={onReset}
          style={{
            backgroundColor: "#df1616",
            color: "#ddd",
            fontSize: "1rem",
            marginLeft: '0.4rem',
            opacity: saving ? 0.5 : 1,
          }}
        >Reset</button>
        <span style={{ marginLeft: "0.5rem", fontSize: "1rem" }}>
          You have unsaved changes.
        </span>
      </div>
    </div>
  );
}
