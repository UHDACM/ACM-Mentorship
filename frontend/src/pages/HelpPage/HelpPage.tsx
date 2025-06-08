import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useTutorialWithDialog from "../../hooks/UseTutorialWithDialog/useTutorialWithDialog";

export default function HelpPage() {
  const navigate = useNavigate();
  const ShowTutorial = useTutorialWithDialog();

  // help cards. uses memo because never changed.
  const HelpCards: HelpCard[] = useMemo<HelpCard[]>(
    () => [
      {
        title: "Getting Started",
        description: "Learn how to make the most of this platform.",
        buttons: [
          {
            text: "Get Started",
            onClick: () => ShowTutorial('getStarted')
          },
        ],
      },
      {
        title: "Get a mentor",
        description: "Follow this guide to find a mentor.",
        buttons: [
          {
            text: "Get a Mentor",
            onClick: () => ShowTutorial('getAMentor')
          },
        ],
      },
      // {
      //   title: "Assessments",
      //   description: "Understand assessments and their role in your mentoring journey.",
      //   buttons: [
      //     {
      //       text: "Learn More",
      //       onClick: () => ShowTutorial('selfAssessments')
      //     },
      //   ],
      // },
      // {
      //   title: "Goals",
      //   description: "Understand goals and their importance in your mentoring journey.",
      //   buttons: [
      //     {
      //       text: "Learn More",
      //       onClick: () => ShowTutorial('goals')
      //     },
      //   ],
    // },
      {
        title: "Mentoring",
        description: "Become a mentor, and learn their responsibilities",
        buttons: [
          {
            text: "Learn More",
            onClick: () => ShowTutorial('mentoring')
          },
        ],
      },
    ],
    []
  );

  return (
    <div
      className={"pageBase"}
      style={{ paddingTop: "3rem", paddingLeft: "3rem", paddingRight: "3rem" }}
    >
      <MinimalisticButton onClick={() => navigate(-1)} style={{marginBottom: '0.5rem'}}>{'<'} Back</MinimalisticButton>
      <p style={{ fontSize: "2rem", fontWeight: 300 }}>Help</p>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          width: "100%",
          marginTop: "0.5rem",
        }}
      >
        {HelpCards.map((cardInfo, index) => {
          return (
            <div
              key={`helpCard_${index}`}
              style={{ padding: "0.5rem" }}
              className="w-full xss:w-3/3 xs:w-1/2 sm:w-1/3 lg:w-1/4 xl:1/5"
            >
              <HelpCard {...cardInfo} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

type HelpCard = {
  title?: string;
  description?: string;
  buttons?: HelpButton[];
};
type HelpButton = {
  text?: string;
  onClick?: Function;
};
function HelpCard({
  title,
  description,
  buttons,
}: {
  title?: string;
  description?: string;
  buttons?: HelpButton[];
}) {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#222",
        borderRadius: "0.5rem",
        border: "1px solid #fff3",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <span style={{ fontSize: "1.35rem" }}>{title}</span>
      <span style={{ fontSize: "1rem" }}>{description}</span>
      <div style={{ width: "100%", display: "flex", justifyContent: "end", marginTop: '0.5rem', gap: '0.1rem', flexWrap: 'wrap' }}>
        {buttons?.map((btn, index) => {
          return (
            <MinimalisticButton
              key={`btn_${index}`}
              onClick={() => btn.onClick && btn.onClick()}
            >
              {btn.text}
            </MinimalisticButton>
          );
        })}
      </div>
    </div>
  );
}
