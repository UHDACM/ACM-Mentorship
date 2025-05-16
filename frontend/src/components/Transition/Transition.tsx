import { useEffect, useRef, useState } from "react";
import { easingType } from "../../scripts/easingFunctions";
import WipeTransition from "./Transitions/WipeTransition";
import DiagonalTransition from "./Transitions/DiagonalExpandTransition";
import FadeTransition from "./Transitions/FadeTransition";
import { CardinalDirection, TransitionType } from "./types";

/**
 *
 * Note: container width and height do not work very well at the moment.
 * @param param0
 * @returns
 */
export default function Transition({
  type,
  toggle,
  initialToggle = false,
  forceStyle,
  forceClass,
  children,
  fps = 60,
  transitionSpeedMS = 200,
  delay = 0,
  delayBefore,
  delayAfter,
  direction,
  easing = "linear",
  hideOnToggleOff = true,
}: {
  type: TransitionType;
  toggle: boolean;
  initialToggle?: boolean;
  children?: React.ReactNode;
  forceStyle?: React.CSSProperties;
  forceClass?: string;
  transitionSpeedMS?: number;
  fps?: number;
  delay?: number;
  delayBefore?: number;
  delayAfter?: number;
  direction?: CardinalDirection
  easing?: easingType;
  cardStyle?: React.CSSProperties;
  cardChildren?: React.ReactNode;
  hideOnToggleOff?: boolean;
}) {
  if (transitionSpeedMS < 1) {
    throw new Error("Transition speed cannot be less than 1 ms.");
  } else if (fps < 0) {
    throw new Error("FPS cannot be less than 0");
  } else if (delay < 0) {
    throw new Error("Delay cannot be negative");
  } else if ((delayBefore || delayAfter) && delay) {
    throw new Error("Cannot combine delay with delayBefore and delayAfter");
  }
  const [trueToggle, setTrueToggle] = useState(initialToggle);
  const trueToggleTimeoutRef = useRef<number|undefined>(undefined);
  
  const [tV, setTV] = useState(initialToggle?1:0); // short for Transition Value
  const tVIntervalRef = useRef<number|undefined>(); // stores interval to cancel later if toggle is changed mid transition
  const numFrames = Math.max((transitionSpeedMS/1000) * fps, 2);
  const transitionUpdateDelayMS = transitionSpeedMS / numFrames;

  useEffect(() => {
    if (numFrames <= 2) {
      console.error('Warning, fps is too low. Transition behavior can be unexpected.');
    }
  }, []);

  // if delay is active, true toggle will be changed some time after toggle is changed.
  useEffect(() => {
    clearTimeout(trueToggleTimeoutRef.current);
    if (delay) {
      trueToggleTimeoutRef.current = setTimeout(() => {
        setTrueToggle(toggle);
      }, delay);
    } else if (delayBefore && toggle) {
      trueToggleTimeoutRef.current = setTimeout(() => {
        setTrueToggle(toggle);
      }, delayBefore);
    } else if (delayAfter && !toggle) {
      trueToggleTimeoutRef.current = setTimeout(() => {
        setTrueToggle(toggle);
      }, delayAfter);
    } else {
      setTrueToggle(toggle);
    }
  }, [
    toggle,
    delay,
    delayBefore,
    delayAfter,
    setTrueToggle,
    trueToggle,
    trueToggleTimeoutRef,
  ]);

  // handles adjusting tV according to value of
  useEffect(() => {
    function cancelInterval() {
      clearInterval(tVIntervalRef.current);
    }
    cancelInterval();
    let count = Math.floor(tV * numFrames);
    tVIntervalRef.current = setInterval(() => {
      if (trueToggle) {
        if (count <= numFrames) {
          setTV(count / numFrames);
          count++;
        } else {
          cancelInterval();
        }
      } else {
        if (count >= 0) {
          setTV(count / numFrames);
          count--;
        } else {
          cancelInterval();
        }
      }
    }, transitionUpdateDelayMS);
  }, [trueToggle]);

  if (hideOnToggleOff && tV == 0) {
    return null;
  }

  return (
    <>
      {type == "wipe" && (
        <WipeTransition
          toggle={trueToggle}
          easing={easing}
          tV={tV}
          children={children}
          forceStyle={forceStyle}
          forceClass={forceClass}
          direction={direction}
        />
      )}
      {type == "diagonal" && (
        <DiagonalTransition
          toggle={trueToggle}
          easing={easing}
          tV={tV}
          children={children}
          forceStyle={forceStyle}
          forceClass={forceClass}
        />
      )}
      {type == "fade" && (
        <FadeTransition
          tV={tV}
          children={children}
          forceStyle={forceStyle}
          forceClass={forceClass}
        />
      )}
    </>
  );
}
