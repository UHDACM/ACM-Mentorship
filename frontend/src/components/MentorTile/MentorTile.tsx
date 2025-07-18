import { useNavigate } from "react-router-dom";
import { IoChatbubbleOutline } from "react-icons/io5";
import { UserObj } from "@shared/types/general";
import MinimalisticButton from "../MinimalisticButton/MinimalisticButton";
import useChatWithUser from "../../hooks/UseChatWithUser/UseChatWithUser";

export default function MentorTile({ mentor }: { mentor: UserObj }) {
  const chatWithUser = useChatWithUser();
  const navigate = useNavigate();
  const {
    username, // @ts-ignore
    fName, // @ts-ignore
    mName, // @ts-ignore
    lName, // @ts-ignore
    bio,
    id,
    displayPictureURL,
  } = mentor;
  return (
    <div
      style={{
        display: "flex",
        padding: "0.5rem",
        borderRadius: "0.5rem",
        border: "1px solid #fff3",
        backgroundColor: "#333",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <img
        style={{
          width: "20%",
          aspectRatio: 1 / 1,
          height: "30%",
          objectFit: "cover",
          borderRadius: "50%",
        }}
        src={displayPictureURL}
      />
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          marginLeft: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "1.25rem",
            lineHeight: "1.25rem",
            marginTop: "0.25rem",
          }}
        >
          {fName} {mName} {lName}
        </span>
        <span
          style={{ fontSize: "0.8rem", opacity: 0.6, marginLeft: "0.5rem" }}
        >
          @{username}
        </span>
        <span style={{ marginLeft: "0.5rem" }}>{bio || "No bio"}</span>
        <div
          style={{
            display: "flex",
            marginTop: "0.25rem",
            width: "100%",
            justifyContent: "end",
            flexWrap: "wrap",
            gap: "0.25rem",
          }}
        >
          <MinimalisticButton
            style={{ fontSize: "0.8rem" }}
            onClick={() => (id ? navigate(`/app/user?id=${id}`) : undefined)}
          >
            View Profile
          </MinimalisticButton>
          <MinimalisticButton
            style={{
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
            }}
            onClick={() => (id ? chatWithUser(id) : undefined)}
          >
            Chat <IoChatbubbleOutline style={{ marginLeft: "0.25rem" }} />
          </MinimalisticButton>
        </div>
      </div>
    </div>
  );
}
