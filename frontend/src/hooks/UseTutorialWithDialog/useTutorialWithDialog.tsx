import { useDispatch } from "react-redux";
import YouTubeEmbed from "../../components/YouTubeEmbed/YouTubeEmbed";
import { setDialog } from "../../features/Dialog/DialogSlice";

type availableTutorial = 'getStarted' | 'selfAssessments' | 'goals' | 'mentoring' | 'getAMentor';
// export const availableTutorials = ['getStarted']
export default function useTutorialWithDialog() {
  const dispatch = useDispatch();
  function ShowTutorial(tutorial: availableTutorial) {
    switch (tutorial) {
      case 'getStarted':
        dispatch(
          setDialog({
            title: "Getting Started",
            subtitle: "Learn how to make the most of this platform.",
            showComponent: (
              <YouTubeEmbed videoID="EseAN3L7BJY" />
            ),
          })
        );
        break;
      case 'selfAssessments':
        dispatch(
          setDialog({
            title: "Assessments",
            subtitle: "Understand self-assessments and their importance.",
            showComponent: (
              <YouTubeEmbed videoID="OkGdrOxPvlk" />
            ),
          })
        );
        break;
      case 'goals':
        dispatch(
          setDialog({
            title: "Goals",
            subtitle: "Understand goals and their importance.",
            showComponent: (
              <YouTubeEmbed videoID="1NqWkthcaYA" />
            ),
          })
        );
        break;
      case 'getAMentor':
        dispatch(
          setDialog({
            title: "Get A Mentor",
            subtitle: "Find out how to get a mentor.",
            showComponent: (
              <YouTubeEmbed videoID="h6UPFmNaHM0" />
            ),
          })
        );
        break;
      case 'mentoring':
        dispatch(
          setDialog({
            title: "Mentoring",
            subtitle: "Find out how to become a mentor, and what a mentor does.",
            showComponent: (
              <YouTubeEmbed videoID="qikoe0O6530" />
            ),
          })
        );
        break;
      default:
        console.warn('No such tutorial', tutorial);
        return null;
    }
  }
  return ShowTutorial;
}
