import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import env from "../../scripts/env";
import { ReduxRootState } from "../../store";
import { setAIMentorFinderTimeoutEnd } from "./AIMentorFinderSlice";
import { UserObj } from "@shared/types/general";
import { MentorMatchResult } from "@shared/types/mentorFinder";
import { isMentorMatchResult } from "@shared/validation/mentorFinder";
import useAuth from "../../hooks/UseAuth/useAuth";

export default function useAIMentorFinder() {
  const dispatch = useDispatch();
  const { timeoutEnd } = useSelector(
    (store: ReduxRootState) => store.AIMentorFinder
  );
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const { getAccessTokenSilently } = useAuth();

  const [isTimedOut, setIsTimedOut] = useState(false);

  // same timeout handling as the ai resume button
  const timeoutCheckRef = useRef<number | null>(null);
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

  const FindMentors = async (query: string): Promise<MentorMatchResult[]> => {
    if (!user) return [];
    if (isTimedOut) return [];

    const token = await getAccessTokenSilently();

    if (!token) {
      throw new Error("Unauthorized");
    }

    let res;
    try {
      const body = {
        query,
        userID: user.id,
      };
      res = await (
        await fetch(env.VITE_AI_ENDPOINT + "/findMentors", {
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

    const { success, data, error, timeoutEnd } = res;

    if (error) {
      if (timeoutEnd) {
        dispatch(setAIMentorFinderTimeoutEnd(timeoutEnd));
      }
      throw new Error(error);
    } else if (success == false) {
      throw new Error("Failed to find mentors. Please try again later.");
    }

    if (!(data instanceof Array)) {
      throw new Error("Received invalid data from server. Please try again later.");
    }

    return data.filter(isMentorMatchResult);
  };

  return { isTimedOut, FindMentors, timeoutEnd };
}
