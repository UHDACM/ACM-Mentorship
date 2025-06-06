import React, { useState } from "react";
import "./NavbarMobile.css";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MentorshipLogo from "../MentorshipLogo/MentorshipLogo";
import { IoChatbubbleOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { setChatOpen } from "../../features/Chat/ChatSlice";
import ShowOnMobile from "../RenderOnMobile/ShowOnMobile";
import ChatsUnreadIndicator from "../../features/Chat/ChatsUnreadIndicator";
import { ReduxRootState } from "../../store";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";

const NavbarMobile: React.FC = () => {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dispatch = useDispatch();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  function handleChatClick() {
    dispatch(setChatOpen(true));
  }

  if (!MyClientSocket || !user) {
    return <></>;
  }

  const navItems: NavItemProps[] = [
    { text: "Home", href: "/app/home" },
    { text: "My Mentor", href: "/app/my-mentor" },
    { text: "My Mentees", href: "/app/my-mentees" },
    {
      text: "You",
      dropdownItems: [
        {
          text: "Assessments",
          href: `/app/assessments?id=${user?.id}`,
        },
        {
          text: "Goals",
          href: `/app/goals?id=${user?.id}`,
        },
        { text: "Profile", href: `/app/user?id=${user?.id}` },
      ],
    },
    { text: "Help", href: "/app/help" },
    {
      text: "Logout",
      onClick: () => MyClientSocket!.logout(),
    },
  ];

  return (
    <>
      <ShowOnMobile>
        <div
          style={{
            backgroundColor: isOpen ? "transparent" : "#222",
            transition: "background-color 300ms ease-in-out",
            borderBottom: "1px solid #fff2",
          }}
          className="flex items-center fixed top-0 w-screen px-4 justify-between z-50 backdrop-blur-sm"
        >
          <div
            className="flex flex-col space-y-2 cursor-pointer z-50"
            style={{ width: '2rem' }}
            onClick={handleToggle}
            aria-expanded={isOpen}
          >
            {/* First Line */}
            <div
              className={`w-full h-0.5 transition-transform duration-300 ${
                isOpen
                  ? "transform rotate-45 translate-y-1.5 bg-white"
                  : "bg-stone-50"
              }`}
            ></div>

            {/* Middle Line */}
            <div
              className={`w-full h-0.5 transition-opacity duration-300 ${
                isOpen ? "opacity-0" : "opacity-100 bg-stone-50"
              }`}
            ></div>

            {/* Third Line */}
            <div
              className={`w-full h-0.5 transition-transform duration-300 ${
                isOpen
                  ? "transform -rotate-45 -translate-y-3.5 bg-white"
                  : "bg-stone-50"
              }`}
            ></div>
          </div>
          <div
            className="z-40 top-2"
            style={{
              left: "50%",
              position: "absolute",
              transform: "translate(-55%, 0%)",
            }}
          >
            <MentorshipLogo scale={0.7} onClick={() => navigate('/app/home')} />
            {/* <img src={logo} alt="Logo" /> */}
          </div>
          <div className="w-20 h-20"></div>
          <div className="absolute right-5">
            <ChatsUnreadIndicator
              style={{ position: "absolute", top: "-0.3rem", right: "-0.2rem" }}
            />
            <IoChatbubbleOutline onClick={handleChatClick} size={"2rem"} />
          </div>
        </div>

        <ul
          className={`fixed nav-link w-full h-screen top-0 left-0 flex flex-col justify-evenly items-left z-10 text-4xl sm:text-6xl transition-transform duration-300 backdrop-blur-sm pt-10 ${
            isOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="w-full backdrop-blur-lg h-full opacity-90 bg-stone-900 absolute"></div>
          {navItems.map((item, index) => (
            <NavItem
              key={index}
              text={item.text}
              href={item.href}
              dropdownItems={item.dropdownItems}
              onClick={() => {
                item.onClick && item.onClick();
                setIsOpen(false);
              }}
            />
          ))}
        </ul>
      </ShowOnMobile>
    </>
  );
};

export default NavbarMobile;

interface NavItemProps {
  text: string;
  href?: string;
  dropdownItems?: NavItemProps[];
  onClick?: () => any;
}

const NavItem: React.FC<NavItemProps> = ({
  text,
  href,
  dropdownItems,
  onClick,
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  return (
    <li className="nav-link relative cursor-pointer">
      <div
        className="flex items-center gap-2 gradient-underline ml-4"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <span
          style={{
            background:
              "linear-gradient(to right,rgb(255, 255, 255), rgb(255, 255, 255))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          onClick={
            href
              ? () => {
                  navigate(href);
                  onClick && onClick();
                }
              : onClick
          }
        >
          {text}
        </span>
        {dropdownItems && (
          <ChevronDown
            className={`transition-transform duration-300 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
            size={40}
            style={{
              color: "#fff",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            strokeWidth={3}
          />
        )}
      </div>

      {dropdownItems && (
        <ul
          className={`ml-8 overflow-hidden transition-all duration-300 ${
            isDropdownOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {dropdownItems.map((item, index) => (
            <ul
              key={index}
              className="text-4xl py-2 translate hover:ml-10 duration-200"
            >
              <NavItem
                text={item.text}
                dropdownItems={item.dropdownItems}
                onClick={onClick}
                href={item.href}
              />
            </ul>
          ))}
        </ul>
      )}
    </li>
  );
};
