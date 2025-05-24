import { useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import { useNavigate } from "react-router-dom";
import Transition from "../../components/Transition/Transition";
import { ChatObj } from "@shared/types/general";
import useChatWithUser from "../UseChatWithUser/UseChatWithUser";

type RecommendedTodo =
  | "TakeFirstAssessment"
  | "CreateFirstGoal"
  | "FinishProfile"
  | "FindMentor"
  | "ChatWithMentor";
type RecommendedTodoAdditionalInformation = {
  id?: string;
};
export default function UseRecommendTodos() {
  const navigate = useNavigate();
  const chatWithUser = useChatWithUser();
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const { chats } = useSelector((store: ReduxRootState) => store.Chat);

  function recommendTodos() {
    const recommendedTodos: [
      RecommendedTodo,
      undefined | RecommendedTodoAdditionalInformation
    ][] = [];

    if (!user) {
      return [];
    }

    if (!user?.isMentee || Object.keys(user.assessments || []).length == 0) {
      recommendedTodos.push(["TakeFirstAssessment", undefined]);
      // return recommendedTodos;
    }

    const { experience, education, certifications, projects, softSkills, bio } =
      user || {};
    const filledSections =
      (experience ? 1 : 0) +
      (education ? 1 : 0) +
      (certifications ? 1 : 0) +
      (projects ? 1 : 0) +
      (bio ? 1 : 0) +
      (softSkills ? 1 : 0);

    const percentageSectionsFilled = filledSections / 5;

    if (percentageSectionsFilled < 0.3) {
      recommendedTodos.push(["FinishProfile", undefined]);
    }

    if (!user?.mentorIDs || user?.mentorIDs.length == 0) {
      recommendedTodos.push(["FindMentor", undefined]);
    }

    if (!user?.goals || Object.keys(user?.goals|| {}).length == 0) {
      recommendedTodos.push(['CreateFirstGoal', undefined]);
    }

    if (user && user.mentorIDs && user.mentorIDs.length > 0) {
      // locate chat with mentorID
      let targetChatObj: ChatObj|undefined;
      for (let chatObj of chats.values()) {
        const chatUsers = Object.keys(chatObj.users);
        if (chatUsers.includes(user?.id||'_') && user.mentorIDs.some(mentorID => chatUsers.includes(mentorID))) {
          targetChatObj = chatObj;
          break;
        }
      }

      if (!targetChatObj) {
        recommendedTodos.push(['ChatWithMentor', undefined]);
      }
    }

    return recommendedTodos;
  }

  function recommendTodoCard(
    recommendation: RecommendedTodo,
    additionalInformation?: RecommendedTodoAdditionalInformation
  ) {
    additionalInformation; //TODO: Actually use additionalInformation

    switch (recommendation) {
      case "TakeFirstAssessment":
        return (
          <ToDoCard
            title="Take A Personal Assessment"
            subTitle="Help mentors learn about you quicker"
            buttonText="Take Assessment"
            onClickButton={() =>
              navigate("/app/assessment?type=new&firstTime=true")
            }
            backgroundImageUrl="https://th.bing.com/th/id/R.2609fa18d5091dc020ae92e8ffde827d?rik=EFdtfi8dYkunsA&riu=http%3a%2f%2fwww.pixelstalk.net%2fwp-content%2fuploads%2f2016%2f05%2fBeautiful-Gradient-Wallpaper.jpg&ehk=wHC%2bBEdWF6fKy71W%2byG8l40bZoD6JV35mjLfEsDFAdQ%3d&risl=&pid=ImgRaw&r=0"
          />
        );
      case "CreateFirstGoal":
        return (
          <ToDoCard
            title={"Create A Goal"}
            subTitle="Chart out tasks that will help you accomplish a goal"
            buttonText="Create A Goal"
            backgroundImageUrl="https://static.vecteezy.com/system/resources/previews/001/227/750/original/abstract-modern-line-gradient-background-vector.jpg"
            onClickButton={() => navigate("/app/goal?new=true")}
          />
        );
      case "FinishProfile":
        return (
          <ToDoCard
            title={"Finish Your Profile"}
            subTitle="Your profile looks a little empty right now. Add to it!"
            buttonText="Finish Profile"
            backgroundImageUrl="https://static.vecteezy.com/system/resources/previews/000/633/705/original/abstract-gradient-geometric-background-simple-shapes-with-trendy-gradients-vector.jpg"
            onClickButton={() => navigate(`/app/user?new=true&id=${user?.id}`)}
          />
        );
      case "FindMentor":
        return (
          <ToDoCard
            title={"Find A Mentor"}
            subTitle="Be guided by someone cool"
            buttonText="Find Mentor"
            backgroundImageUrl="https://static.vecteezy.com/system/resources/previews/004/245/372/original/minimal-abstract-orange-scratch-grunge-texture-in-black-background-vector.jpg"
            onClickButton={() => navigate(`/app/my-mentor`)}
          />
        );
      case "ChatWithMentor":
        return (
          <ToDoCard
            title={"Chat with your Mentor!"}
            subTitle="Ask them some questions, see if you can meet, whatever you want to do!"
            buttonText="Chat With Mentor"
            backgroundImageUrl="https://th.bing.com/th/id/R.d6f43944c2d1479537c7fb363d49cf6e?rik=cGLD3x%2bNuapRBg&riu=http%3a%2f%2fwww.pixelstalk.net%2fwp-content%2fuploads%2f2016%2f06%2fHD-Abstract-Backgrounds.jpg&ehk=UDPzXal8%2fsJLCiC5SLZcOQIciHko6lyZzShvDSEaFYM%3d&risl=&pid=ImgRaw&r=0"
            onClickButton={() => (user && user.mentorIDs && user.mentorIDs.length > 0) ? chatWithUser(user?.mentorIDs[0]) : undefined}
          />
        );
      default:
        return null;
    }
  }
  return { recommendTodoCard, recommendTodos };
}

export function ToDoCard({
  title,
  subTitle,
  buttonText,
  onClickButton,
  backgroundImageUrl,
}: {
  title?: string;
  subTitle?: string;
  buttonText?: string;
  onClickButton?: () => any;
  backgroundImageUrl?: string;
}) {
  return (
    <Transition
      hideOnToggleOff={false}
      type="wipe"
      easing="inOutSine"
      toggle={true}
      initialToggle={false}
      delay={25}
      transitionSpeedMS={300}
      forceClass="w-full xss:w-1/2 xs:w-1/2 sm:w-1/3 lg:w-1/4 xl:1/5"
    >
      <div
        style={{
          padding: "0.3rem",
          paddingBottom: "0.25rem",
          paddingTop: "0.25rem",
          width: "100%",
        }}
      >
        <div
          style={{
            height: "14rem",
            borderRadius: "0.5rem",
            overflow: "hidden",
            position: "relative",
            zIndex: 0,
            border: "1px solid #fff4",
            boxSizing: "border-box",
          }}
        >
          <img
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 1,
              position: "absolute",
              filter: "blur(2px)",
              opacity: 0.8,
            }}
            draggable={false}
            src={
              backgroundImageUrl ||
              "https://th.bing.com/th/id/R.2609fa18d5091dc020ae92e8ffde827d?rik=EFdtfi8dYkunsA&riu=http%3a%2f%2fwww.pixelstalk.net%2fwp-content%2fuploads%2f2016%2f05%2fBeautiful-Gradient-Wallpaper.jpg&ehk=wHC%2bBEdWF6fKy71W%2byG8l40bZoD6JV35mjLfEsDFAdQ%3d&risl=&pid=ImgRaw&r=0"
            }
          />
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 2,
              top: 0,
              position: "relative",
              padding: "0.5rem",
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                fontSize: "1.5rem",
                lineHeight: "1.5rem",
                fontWeight: 500,
                textAlign: "center",
                marginBottom: "0.2rem",
                color: "#ddd",
              }}
            >
              {title || "Take A Personal Assessment"}
            </span>
            <span
              style={{
                fontSize: "1rem",
                textAlign: "center",
                lineHeight: "1.2rem",
                marginBottom: "0.2rem",
                color: "#ddd",
              }}
            >
              {subTitle || "Help your mentors learn about you"}
            </span>
            <MinimalisticButton
              onClick={onClickButton}
              style={{
                fontSize: "0.9rem",
                marginTop: "0.3rem",
                color: "#ddd",
                border: "2px solid #ddd",
              }}
            >
              {buttonText || "Take Assessment"}
            </MinimalisticButton>
          </div>
        </div>
      </div>
    </Transition>
  );
}
