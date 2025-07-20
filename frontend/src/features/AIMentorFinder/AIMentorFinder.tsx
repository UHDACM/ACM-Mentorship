import { useState } from "react";
import { useDispatch } from "react-redux";
import { MentorMatchResult } from "@shared/types/mentorFinder";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import MentorTile from "../../components/MentorTile/MentorTile";
import { addDialog } from "../Dialog/DialogSlice";
import useAIMentorFinder from "./useAIMentorFinder";

export default function AIMentorFinder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MentorMatchResult[] | undefined>(
    undefined
  );
  const { FindMentors, isTimedOut, isSearching } = useAIMentorFinder();
  const dispatch = useDispatch();

  async function handleFind() {
    if (!query.trim()) {
      return;
    }

    try {
      const res = await FindMentors(query);
      setResults(res);
    } catch (e) {
      dispatch(
        addDialog({ title: "Error", subtitle: (e as Error).message })
      );
    }
  }

  return (
    <div style={{ width: "100%", marginBottom: "1.5rem" }}>
      <span style={{ fontSize: "1.5rem" }}>AI Mentor Finder</span>
      <p
        style={{
          margin: 0,
          marginBottom: "0.5rem",
          opacity: 0.6,
          fontSize: "0.9rem",
        }}
      >
        Describe what you want help with and we'll pull out the mentors that fit
        best.
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key == "Enter" && handleFind()}
          placeholder="ex: someone who does backend work and can help me prep for interviews"
          style={{
            flex: 1,
            minWidth: "15rem",
            fontSize: "1rem",
            padding: "0.5rem",
            borderRadius: "0.3rem",
            backgroundColor: "#333",
            border: "1px solid #fff3",
            color: "white",
          }}
        />
        <MinimalisticButton
          onClick={handleFind}
          disabled={isTimedOut || isSearching}
        >
          {isSearching ? "Searching..." : "Find Mentors"}
        </MinimalisticButton>
      </div>

      {results && results.length == 0 && (
        <p
          style={{
            margin: 0,
            marginTop: "0.5rem",
            fontSize: "1.1rem",
            opacity: 0.8,
          }}
        >
          Nothing matched that. Try describing what you want help with a
          different way.
        </p>
      )}

      {results && results.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
          {results.map((r) => (
            <div
              className="w-full xss:w-3/3 sm:w-1/2 lg:w-1/3 xl:1/5"
              style={{ padding: "0.25rem", boxSizing: "border-box" }}
              key={r.mentor.id}
            >
              <MentorTile mentor={r.mentor} />
              <span
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  opacity: 0.7,
                  padding: "0.25rem",
                }}
              >
                {r.reason}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
