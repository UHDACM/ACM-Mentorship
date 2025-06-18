import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import env from "../../scripts/env";
import { ReduxRootState } from "../../store";
import { setAIResumeProfileButtonTimeoutEnd } from "./AIResumeProfileButtonSlice";
import { validateUserObj } from "@shared/validation/user";
import useAuth from "../../hooks/UseAuth/useAuth";

export default function useAIResumeProfileButton() {
  const dispatch = useDispatch();
  const { isGenerating, timeoutEnd } = useSelector(
    (store: ReduxRootState) => store.AIResumeProfileButton
  );
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const { getAccessTokenSilently } = useAuth();

  const [isTimedOut, setIsTimedOut] = useState(false);

  const timeoutCheckRef = useRef<number | null>(null);
  /**
   * Handles the timeout logic for the AI resume profile button.
   * Clears any existing timeout and sets a new one if timeoutEnd is in the future.
   */
  useEffect(() => {
    if (timeoutCheckRef.current) {
      clearTimeout(timeoutCheckRef.current);
    }

    if (timeoutEnd && timeoutEnd > Date.now()) {
      setIsTimedOut(true);
      const timeLeft = timeoutEnd - Date.now();
      timeoutCheckRef.current = window.setTimeout(() => {
        setIsTimedOut(false);
      }, timeLeft);
    } else {
      setIsTimedOut(false);
    }

    return () => {
      if (timeoutCheckRef.current) {
        clearTimeout(timeoutCheckRef.current);
      }
    };
  }, [timeoutEnd]);

  const GetAIResumeProfileUpdate = async (text: string, combine: boolean) => {
    if (!user) return;
    if (isGenerating) return;
    if (isTimedOut) return;
  

    const token = await getAccessTokenSilently();

    if (!token) {
      throw new Error("Unauthorized");
    }

    let res;
    try {
      const body = {
        text,
        combine,
        userID: user.id,
      };
      res = await (
        await fetch(env.VITE_AI_ENDPOINT + "/generateResumeProfile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        })
      ).json();
    } catch (error) {
      throw new Error("Network error, please try again later.");
    }

    const { success, data, error, timeoutEnd, successNotes } = res;
    console.log("AI Resume Profile Response:", res);
    // handle errors
    if (error) {
      if (timeoutEnd) {
        dispatch(setAIResumeProfileButtonTimeoutEnd(timeoutEnd));
      }

      throw new Error(error);
    }
    // handle no error, but also no success
    else if (success == false) {
      throw new Error(
        "Failed to generate resume profile. Please try again later."
      );
    }

    // handle success
    try {
      validateUserObj(data);
    } catch (error) {
      console.error("Invalid user data received from AI resume profile:", (error as Error).message);
      throw new Error(
        "Received invalid user data from server. Please try again later."
      );
    }
    return { data, successNotes };
  };

  return { isTimedOut, isGenerating, GetAIResumeProfileUpdate, timeoutEnd };
}
