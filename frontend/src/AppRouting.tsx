import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import IntroOverlay from "./components/IntroOverlay/IntroOverlay";
import { Provider } from "react-redux";
import { store } from "./store";
import Dialog from "./features/Dialog/Dialog";
import App from "./components/App";
import HomePage from "./pages/HomePage/HomePage";
import NewUserPage from "./pages/NewUserPage/NewUserPage";
import UserPage from "./pages/UserPage/UserPage";
import P404Page from "./pages/404Page/P404Page";
import Alert from "./features/Alert/Alert";
import AssessmentPage from "./pages/AssessmentPage/AssessmentPage";
import Assessments from "./pages/Assessments/Assessments";
import GoalPage from "./pages/GoalPage/GoalPage";
import GoalsPage from "./pages/GoalsPage/GoalsPage";
import Playground from "./pages/Playground/Playground";
import MymentorPage from "./pages/MyMentorPage/MyMentorPage";
import MyMenteesPage from "./pages/MyMenteesPage/MyMenteesPage";
import MentorGuidelinesPage from "./pages/GuidelinesPage/MentorGuidelinesPage";
import MenteeGuidelinesPage from "./pages/GuidelinesPage/MenteeGuidelinesPage";
import HelpPage from "./pages/HelpPage/HelpPage";
import { checkViteEnvironmentVariables } from "./scripts/envCheck";

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage/>
  },
  {
    path: '/playground',
    element: <Playground/>
  },
  {
    path: '/app',
    element: <App/>,
    children: [
      {
        path: 'home',
        element: <HomePage/>
      },
      {
        path: 'user',
        element: <UserPage/>
      },
      {
        path: 'new-user',
        element: <NewUserPage/>
      },
      {
        path: 'assessment',
        element: <AssessmentPage/>
      },
      {
        path: 'assessments',
        element: <Assessments/>
      },
      {
        path: 'goals',
        element: <GoalsPage/>
      },
      {
        path: 'goal',
        element: <GoalPage/>
      },
      {
        path: 'my-mentor',
        element: <MymentorPage/>
      },
      {
        path: 'my-mentees',
        element: <MyMenteesPage/>
      },
      {
        path: 'mentor-guidelines',
        element: <MentorGuidelinesPage/>
      },
      {
        path: 'mentee-guidelines',
        element: <MenteeGuidelinesPage/>
      },
      {
        path: 'help',
        element: <HelpPage/>
      },
      {
        path: '*',
        element: <P404Page/>
      },
    ]
  },
]);


export default function AppRouting() {
  checkViteEnvironmentVariables();
  return <>
    <Provider store={store}>
      <Alert/>
      <Dialog/>
      <IntroOverlay/>
      <RouterProvider router={router}/>
    </Provider>
  </>
}