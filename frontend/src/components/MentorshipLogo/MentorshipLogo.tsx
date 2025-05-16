import ACMLogoTriangle from "../../assets/ACM Orange.png";
import { FunctionAny } from "@shared/types/general";
import styles from './MentorshipLogo.module.css';

export default function MentorshipLogo({scale = 1, hideText = false, style, onClick }: { scale?: number, hideText?: boolean, style?: React.CSSProperties, onClick?: FunctionAny }) {
  let size = 0.7;
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", transform: `scale(${scale})`, transition: 'transform 200ms ease-in-out', ...style }}>
      <div style={{marginRight: `${-1 * size}rem`, zIndex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <img src={ACMLogoTriangle} style={{ width: `${7*size}rem`, zIndex: 2 }} />
        {/* <img src={ACMLogoTriangle} style={{ width: `${9*size}rem`, position: 'absolute', zIndex: 1, filter: 'brightness(0) saturate(100%)', mixBlendMode: 'difference', backgroundColor: '#010101' }} /> */}
      </div>
      <div className={`${!hideText?'':styles.active}`} style={{ color: "white", fontSize: `${3*size}rem`, fontWeight: 100, paddingBottom: `${0.5*size}rem`, overflow: 'hidden', zIndex: 0 }}>
        Mentorship
      </div>
    </div>
  );
}
