import { ObjectAny } from "@shared/types/general";
import AutowidthInput from "react-autowidth-input";
import {forwardRef} from 'react'

export default forwardRef<HTMLInputElement, {
  value?: string;
  onChange?: (v: string) => any;
  style?: React.CSSProperties;
  disabled?: boolean;
  placeholder?: string;
}>(function MinimalisticInput({
  value,
  onChange,
  style,
  disabled,
  placeholder
}, ref){
  return (
    <AutowidthInput
      ref={ref}
      onChange={(e: ObjectAny) => onChange && onChange(e.target.value)}
      style={{
        fontSize: "1rem",
        padding: '0.3rem',
        borderRadius: '0.3rem',
        margin: 0,
        backgroundColor: disabled ? "transparent" : "#333",
        textWrap: "wrap",
        cursor: 'text',
        userSelect: 'all',
        ...style,
      }}
      placeholder={placeholder}
      disabled={disabled}
      value={value||' '}
      extraWidth={4}
      minWidth={'2rem'}
      placeholderIsMinWidth={true}
    />
  );
});
