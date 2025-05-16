import {
  easingType,
  getEasingFunction,
} from "../../../scripts/easingFunctions";
import { CardinalDirection } from "../types";

export default function WipeTransition({
  tV,
  children,
  easing,
  toggle,
  forceStyle,
  forceClass,
  direction
}: {
  tV: number;
  children?: React.ReactNode;
  easing: easingType;
  toggle: boolean;
  forceStyle?: React.CSSProperties,
  forceClass?: string,
  direction?: CardinalDirection
}) {
  const easingFunction = getEasingFunction(easing);
  const tVAdjusted = easingFunction(1-tV) * 100;
  let clipPathVal: string = ``;
  switch (direction) {
    case 'left':
    case undefined:
      // default is left.
      clipPathVal = `0% ${toggle?0:tVAdjusted}% 0% ${toggle?tVAdjusted:0}%`;
      break;
    case 'down':
      clipPathVal = `${toggle?0:tVAdjusted}% 0% ${toggle?tVAdjusted:0}% 0%`;
      break;
    case 'up':
      clipPathVal = `${toggle?tVAdjusted:0}% 0% ${toggle?0:tVAdjusted}% 0%`;
      break;
    case 'right':
      clipPathVal = `0% ${toggle?tVAdjusted:0}% 0% ${toggle?0:tVAdjusted}%`;
      break;
  }
  return (
    <div className={forceClass} style={{ clipPath: `inset(${clipPathVal})`, ...forceStyle }}>
      {children}
    </div>
  );
}
