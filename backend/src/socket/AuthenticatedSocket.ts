import { Socket } from "socket.io";
import {
  DBCreate,
  DBDelete,
  DBDeleteWithID,
  DBGet,
  DBGetWithID,
  DBObj,
  DBSetWithID,
} from "../db";
import { ObjectAny } from "../types";
import {
  Certification,
  Education,
  Experience,
  isValidAnsweredAssessmentQuestions,
  isValidAssessmentAction,
  isValidCertification,
  isValidEducation,
  isValidExperience,
  isValidFirstName,
  isValidLastName,
  isValidMentorshipRequestAction,
  isValidMiddleName,
  isValidNames,
  isValidProject,
  isValidSocial,
  isValidUsername,
  MAX_BIO_LENGTH,
  Project,
} from "../scripts/validation";

export type AuthenticatedSocketAdditionalParameters = {
  deleteAccountAfterDisconnect?: boolean;
  testing?: boolean;
};

export type AuthenticatedSocketSetupParameters = {
  userSubID: string;
  userEmail: string;
  pfp: string;
};

type AuthenticatedSocketState =
  | "connecting"
  | "authed_nouser"
  | "authed_user"
  | "connect_error";

type UserObj = {
  fName?: string;
  mName?: string;
  lName?: string;
  id?: string;
  OAuthSubID?: string;
  email?: string;
  isMentee?: boolean;
  assessments?: string[];
  username?: string;
  usernameLower?: string;
  menteeIDs?: string[];
  mentorID?: string;
  DisplayPictureURL?: string;
  socials?: string[];
  experience?: Experience[];
  certifications?: Certification[];
  education?: Education[];
  projects?: Project[];
  isMentor?: boolean;
  softSkills?: string[];
  acceptingMentees?: boolean;
  bio?: string;
  testing?: boolean;
  mentorshipRequests?: string[];
};
export default class AuthenticatedSocket {
  socket: Socket;
  state: AuthenticatedSocketState;
  user: UserObj;
  currentSocketStateEvents: { [key: string]: (...args: any[]) => void } = {};
  socketEventTestingVariables: Map<string, unknown> = new Map<
    string,
    unknown
  >();
  inAllSockets: boolean;
  testing: boolean = false;
  static AllSockets: Map<string, Array<AuthenticatedSocket>> = new Map();
  static AllAcceptingMentorIDs: Set<string> = new Set();

  constructor(
    socket: Socket,
    setupData: AuthenticatedSocketSetupParameters,
    additional?: any
  ) {
    const { userSubID, userEmail, pfp } = setupData;
    this.inAllSockets = false;
    this.socket = socket;
    this.user = {
      OAuthSubID: userSubID,
      email: userEmail,
      DisplayPictureURL: pfp,
    };
    this._processAdditionalSettings(additional);
    this.addUnconditionalEvents();
    this._enter_connect_state();
  }

  /**
   * These events should always run, regardless of socket state.
   */
  private addUnconditionalEvents() {
    this.socket.on("disconnect", () => {
      this.removeSelfFromSocketMap();
    });

    this.socket.on("connect", () => {
      this._enter_connect_state();
    });
  }

  private _processAdditionalSettings(additional: ObjectAny) {
    // process additional if we are in testing mode.
    if (!additional || typeof additional != "object") {
      return;
    }

    if (!additional.testing) {
      return;
    }
    this.testing = true;

    this._enableTestingListeners();
    if (additional.deleteAccountAfterDisconnect) {
      this.socketEventTestingVariables.set(
        "deleteAccountAfterDisconnect",
        true
      );

      this.socket.on("disconnect", async () => {
        // its possible client changed deleteAccountAfterDisconnect value to false.
        if (
          !this.socketEventTestingVariables.get("deleteAccountAfterDisconnect")
        ) {
          return;
        }
        console.log("deleting user", this.user.id);
        try {
          await DBDeleteWithID("user", this.user.id);
        } catch (err) {
          console.error(
            "_processAdditionalSettings | problem deleting user after disconnect " +
              err.message
          );
        }
      });
    }
  }

  private async _enter_connect_state() {
    const userSubID = this.user.OAuthSubID;
    this._setState("connecting");
    let userData: DBObj;

    try {
      const res = await DBGet("user", [["OAuthSubID", "==", userSubID]]);
      // enter authed no user state if no user data exists for this subID.
      if (!res || res.length == 0) {
        this._enter_authed_nouser_state();
        return;
      }
      userData = res[0];
    } catch (err) {
      // if there is an error getting data, then set state and disconnect.
      this._setState("connect_error");
      this.socket.disconnect();
      return;
    }
    // userData has been retreived at this point.
    this._enter_authed_user_state(userData.id);
  }

  /**
   * In authed_nouser state we wait for user to submit data to create their user profile.
   * Once this data is received and validated, they can enter the authed_user state.
   * @param userSubID OAuth subID.
   */
  private async _enter_authed_nouser_state() {
    this._cleanupSocketEvents();
    this._setState("authed_nouser");

    this._addStateSocketEvent("createUser", this.handleCreateUser.bind(this));
  }

  private async _enter_authed_user_state(userID: string) {
    this.user = await GetUserData(userID);

    this.addSelfToSocketMap();
    this._cleanupSocketEvents();
    this._setState("authed_user");

    // // send user its own data, userID, and assessment data.
    // const assessments = await GetUserAssessments(this.user.id);
    const availableAssessmentQuestions =
      await GetAvailableAssessmentQuestions();

    this.sendClientData("initialData", {
      user: this.user,
      assessmentQuestions: availableAssessmentQuestions,
    });

    this._addStateSocketEvent(
      "updateProfile",
      this.handleUpdateProfile.bind(this)
    );

    this._addStateSocketEvent(
      "getAllMentors",
      this.handleGetAllMentors.bind(this)
    );

    this._addStateSocketEvent(
      "submitAssessment",
      this.handleSubmitAssessment.bind(this)
    );

    this._addStateSocketEvent(
      "mentorshipRequest",
      this.handleMentorshipRequest.bind(this)
    );

    this._addStateSocketEvent("getUser", this._getUser.bind(this));

    this._addStateSocketEvent("getAssessment", this._getAssessment.bind(this));

    this._addStateSocketEvent(
      "getAvailableAssessmentQuestions",
      this.handleGetAvailableAssessmentQuestions.bind(this)
    );

    this._addStateSocketEvent(
      "getMentorshipRequestBetweenUsers",
      this.getFindMentorshipRequestBetweenUsers.bind(this)
    );
  }

  private _setState(state: AuthenticatedSocketState) {
    this.state = state;
    this.socket.emit("state", state);
  }

  sendClientMessage(title: string, body: string) {
    this.socket.emit("message", { title, body });
  }

  /**
   * This function is called when state = authed_nouser.
   * @param dataRaw should contain fName, lName, username, and optionally mName.
   * @param callback callback that is used to tell client if successful or not.
   * @returns nada
   */
  async handleCreateUser(dataRaw: unknown, callback: unknown) {
    console.log("handleCreateUserRequest", dataRaw);
    const createUserSubject = "Fatal error while creating user: ";
    try {
      if (!callback || typeof callback != "function") {
        this.sendClientMessage(
          "Error",
          createUserSubject + "No callback function was provided."
        );
        return;
      } else if (!dataRaw || typeof dataRaw != "object") {
        callback(false);
        this.sendClientMessage(
          "Error",
          createUserSubject + "No data was provided."
        );
        return;
      }

      const data: ObjectAny = dataRaw;
      console.log("handleCreateUserRequest", data);
      const { fName, mName, lName, username } = data;

      // verify names are useable
      try {
        isValidNames(fName, mName, lName);
      } catch (err: unknown) {
        if (err instanceof Error) {
          callback(false);
          this.sendClientMessage("Error", createUserSubject + err.message);
          return;
        }
        callback(false);
        this.sendClientMessage(
          "Error",
          createUserSubject + "Something went wong while validating names"
        );
        return;
      }

      // verify username is available
      try {
        await isValidUsername(username);
      } catch (err: unknown) {
        if (err instanceof Error) {
          callback(false);
          this.sendClientMessage("Error", createUserSubject + err.message);
          return;
        }
        callback(false);
        this.sendClientMessage(
          "Error",
          createUserSubject + "Something went wrong while validating username"
        );
        return;
      }

      // stuff is valid, create user.
      let userID: string;

      // remove any surrounding stuff from username.
      const usernameProcessed = (username as string).trim();

      const { DisplayPictureURL, OAuthSubID, email } = this.user;
      const userData: UserObj = {
        username: usernameProcessed,
        usernameLower: usernameProcessed.toLowerCase(),
        fName,
        mName: mName || null,
        lName,
        OAuthSubID: OAuthSubID,
        DisplayPictureURL: DisplayPictureURL,
        email: email,
      };
      this.testing && (userData.testing = true);
      try {
        userID = await DBCreate("user", userData);
      } catch (err) {
        if (err instanceof Error) {
          callback(false);
          this.sendClientMessage("Error", createUserSubject + err.message);
          return;
        }
        callback(false);
        this.sendClientMessage(
          "Error",
          createUserSubject +
            "Something went wrong while creating your account."
        );
        return;
      }

      callback(true);
      this._enter_authed_user_state(userID);
    } catch (err) {
      if (err instanceof Error) {
        this.sendClientMessage("Error", createUserSubject + err.message);
        return;
      }
    }
  }

  async handleUpdateProfile(dataRaw: unknown, callback: unknown) {
    await this._updateSelf();
    const handleUpdateProfileSubject = "Error while updating profile: ";
    try {
      if (!callback || typeof callback != "function") {
        this.sendClientMessage(
          "Error",
          handleUpdateProfileSubject + "No callback function was provided."
        );
        return;
      } else if (!dataRaw || typeof dataRaw != "object") {
        callback(false);
        this.sendClientMessage(
          "Error",
          handleUpdateProfileSubject + "No data was provided."
        );
        return;
      }

      const data: ObjectAny = dataRaw;
      // extract all possible updates
      const {
        username,
        fName,
        mName,
        lName,
        socials,
        experience,
        education,
        certifications,
        projects,
        softSkills,
        isMentor,
        acceptingMentees,
        bio,
      } = data;
      console.log("processing update profile data", data);
      const newUserObj: UserObj = {};

      // process username
      if (username) {
        try {
          await isValidUsername(username);
          newUserObj.username = username.trim();
          newUserObj.usernameLower = username.trim().toLowerCase();
        } catch (err) {
          if (err instanceof Error) {
            this.sendClientMessage(
              "Error",
              handleUpdateProfileSubject + err.message
            );
            callback(false);
            return;
          }
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject +
              "Something went wrong while validating new username."
          );
          callback(false);
        }
      }

      // process fName, mName, and lName
      try {
        if (fName || typeof fName == "string") {
          isValidFirstName(fName);
          newUserObj.fName = fName;
        }
        if (mName || typeof mName == "string") {
          isValidMiddleName(mName);
          newUserObj.mName = mName || null;
        }
        if (lName || typeof lName == "string") {
          isValidLastName(lName);
          newUserObj.lName = lName;
        }
      } catch (err) {
        if (err instanceof Error) {
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject + err.message
          );
        }
        callback(false);
        return;
      }

      // process socials
      if (socials) {
        if (!(socials instanceof Array)) {
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject + "Socials are not formatted correctly."
          );
          callback(false);
          return;
        }

        // ensure all socials are valid.
        for (let social of socials) {
          try {
            isValidSocial(social);
          } catch (err) {
            if (err instanceof Error) {
              this.sendClientMessage(
                "Error",
                handleUpdateProfileSubject + err.message
              );
            }
            callback(false);
            return;
          }
        }

        newUserObj.socials = socials;
      }

      if (experience) {
        if (!(experience instanceof Array)) {
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject +
              "Experiences are not formatted correctly."
          );
          callback(false);
          return;
        }

        // ensure all experiences are valid.
        for (let currentExperience of experience) {
          try {
            isValidExperience(currentExperience);
          } catch (err) {
            if (err instanceof Error) {
              this.sendClientMessage(
                "Error",
                handleUpdateProfileSubject + err.message
              );
            }
            callback(false);
            return;
          }
        }
        newUserObj.experience = experience;
      }

      if (education) {
        if (!(education instanceof Array)) {
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject +
              "Educations are not formatted correctly."
          );
          callback(false);
          return;
        }

        // ensure all experiences are valid.
        for (let currentEducation of education) {
          try {
            isValidEducation(currentEducation);
          } catch (err) {
            if (err instanceof Error) {
              this.sendClientMessage(
                "Error",
                handleUpdateProfileSubject + err.message
              );
            }
            callback(false);
            return;
          }
        }
        newUserObj.education = education;
      }

      if (certifications) {
        if (!(certifications instanceof Array)) {
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject +
              "Educations are not formatted correctly."
          );
          callback(false);
          return;
        }

        // ensure all experiences are valid.
        for (let certification of certifications) {
          try {
            isValidCertification(certification);
          } catch (err) {
            if (err instanceof Error) {
              this.sendClientMessage(
                "Error",
                handleUpdateProfileSubject + err.message
              );
            }
            callback(false);
            return;
          }
        }
        newUserObj.certifications = certifications as Certification[];
      }

      if (projects) {
        if (!(projects instanceof Array)) {
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject +
              "Experiences are not formatted correctly."
          );
          callback(false);
          return;
        }

        // ensure all experiences are valid.

        for (let project of projects) {
          try {
            isValidProject(project);
          } catch (err) {
            if (err instanceof Error) {
              this.sendClientMessage(
                "Error",
                handleUpdateProfileSubject + err.message
              );
            }
            callback(false);
            return;
          }
        }
        newUserObj.projects = projects;
      }

      if (softSkills) {
        if (!(softSkills instanceof Array)) {
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject +
              "Soft skills are not correctly formatted."
          );
          callback(false);
          return;
        }
        for (let softSkill of softSkills) {
          if (typeof softSkill != "string" || softSkill.length < 3) {
            this.sendClientMessage(
              "Error",
              handleUpdateProfileSubject +
                "Soft skill " +
                softSkill +
                " is not valid."
            );
            callback(false);
            return;
          }
        }

        newUserObj.softSkills = softSkills;
      }

      if (typeof isMentor == "boolean") {
        newUserObj.isMentor = isMentor;
      } else if (isMentor) {
        this.sendClientMessage(
          "Error",
          handleUpdateProfileSubject + "isMentor value is invalid."
        );
        callback(false);
        return;
      }

      if (bio) {
        if (typeof bio != "string") {
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject + "Bio is not valid. "
          );
          callback(false);
          return;
        }
        let bioModified = bio.trim();
        if (bioModified.length > MAX_BIO_LENGTH) {
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject + "Bio is too long. "
          );
          callback(false);
          return;
        }
        newUserObj.bio = bioModified;
      }

      if (typeof acceptingMentees == "boolean") {
        newUserObj.acceptingMentees = acceptingMentees;
      } else if (acceptingMentees) {
        this.sendClientMessage(
          "Error",
          handleUpdateProfileSubject + "acceptingMentees value is not valid. "
        );
        callback(false);
        return;
      }

      // everything valid, write to profile
      try {
        await DBSetWithID("user", this.user.id, newUserObj, true);
        console.log("_!-_Updating profile", this.user.id, newUserObj);
      } catch (err) {
        if (err instanceof Error) {
          this.sendClientMessage(
            "Error",
            handleUpdateProfileSubject + err.message
          );
        }
        callback(false);
        return;
      }

      const isAcceptingMentor =
        (this.user.acceptingMentees || acceptingMentees) &&
        (this.user.isMentor || isMentor);
      if (isAcceptingMentor) {
        console.log("added to mentor list", this.user.username);
        this.addSelfToAcceptingMentorIDsList();
      } else if (!isMentor || !acceptingMentees) {
        console.log("removed from mentor list", this.user.username);
        // remove user if they made a change that would affect their accepting mentor status.
        this.removeSelfFromAcceptingMentorIDsList();
      }

      callback(true);
    } catch (err) {
      if (err instanceof Error) {
        this.sendClientMessage(
          "Error",
          handleUpdateProfileSubject + err.message
        );
        return;
      }
    }
  }

  /**
   * This function is called by an event, fetches all available mentors, and sends them back via callback.
   * @param callback function that receives error or all mentors in an array.
   * @returns nada
   */
  async handleGetAllMentors(callback: unknown) {
    await this._updateSelf();
    const handleGetAllMentorsSubject = "Error while fetching all mentors: ";
    try {
      if (!callback || typeof callback != "function") {
        this.sendClientMessage(
          "Error",
          handleGetAllMentorsSubject + "Callback was not specified."
        );
        return;
      }

      let allMentors: Array<ObjectAny> = [];
      try {
        const AllMentorIDs = Array.from(
          AuthenticatedSocket.AllAcceptingMentorIDs.values()
        );
        const promises = AllMentorIDs.map(async (mentorID: string) => {
          return DBGetWithID("user", mentorID);
        });

        const results = await Promise.allSettled(promises);

        results.forEach((datProm, index) => {
          if (datProm.status == "rejected") {
            AuthenticatedSocket.AllAcceptingMentorIDs.delete(
              AllMentorIDs[index]
            ); //Remove from set
            return;
          }

          const dat = datProm.value;
          if (!dat) {
            AuthenticatedSocket.AllAcceptingMentorIDs.delete(
              AllMentorIDs[index]
            ); //Remove from set
          } else {
            allMentors.push(dat);
          }
        });
      } catch (err) {
        if (err instanceof Error) {
          this.sendClientMessage(
            "Error",
            handleGetAllMentorsSubject +
              "Something went wrong while fetching all users."
          );
          callback(false);
          return;
        }
      }
      callback(allMentors);
    } catch (err) {
      if (err instanceof Error) {
        this.sendClientMessage(
          "Error",
          handleGetAllMentorsSubject + err.message
        );
        return;
      }
    }
  }

  /**
   * Handles submit assessment event.
   *
   * Assumes data is an object with
   * ```
   * {
   *    action: AssessmentAction,
   *    questions: AssessmentQuestionObj[],
   *    id: string | undefined
   * }
   * ```
   * If assessmentID is provided, then this is updating an existing assessment
   *
   * questions must contain at least 1 assessmentQuestionObj and assessmentID must belong to the current user
   *
   * @param data
   * @param callback
   */
  async handleSubmitAssessment(dataRaw: unknown, callback: unknown) {
    await this._updateSelf();
    console.log("this.user.assessments", this.user.assessments);
    if (!this.user.assessments) {
      this.user.assessments = [];
    }
    const handleSubmitAssessmentHeader =
      "Problem trying to submit assessment: ";
    try {
      if (!callback || typeof callback != "function") {
        this.sendClientMessage(
          "Error",
          handleSubmitAssessmentHeader + "No callback was provided."
        );
        return;
      }

      const ErrorCallback = (msg: string) => {
        callback(false);
        this.sendClientMessage("Error", handleSubmitAssessmentHeader + msg);
      };

      if (!dataRaw || typeof dataRaw != "object") {
        ErrorCallback("Data is invalid.");
        return;
      }

      const data: ObjectAny = dataRaw;
      const { questions, id, action } = data;

      if (!isValidAssessmentAction(action)) {
        ErrorCallback("Assessment action is invalid.");
        return;
      }

      // do basic type checking.
      if (id && typeof id != "string") {
        ErrorCallback("AssessmentID value is invalid.");
        return;
      } else if (questions && !(questions instanceof Array)) {
        ErrorCallback("Questions value is invalid.");
        return;
      }

      if (action == "create") {
        if (!isValidAnsweredAssessmentQuestions(questions)) {
          ErrorCallback("Questions are not valid");
          return;
        }

        // create assessment, send assessment to user after creation
        let createdAssessmentID: string;
        try {
          const assessmentObj: ObjectAny = {
            questions,
            userID: this.user.id,
            date: Date.now(),
            published: false,
          };
          this.testing && (assessmentObj.testing = true);
          createdAssessmentID = await DBCreate("assessment", assessmentObj);
        } catch (err: unknown) {
          if (err instanceof Error) {
            ErrorCallback(err.message);
            return;
          }
          ErrorCallback("Something went wrong while creating assessment");
          return;
        }

        // enable isMentee if not enabled, and add assessment to assessments array
        try {
          this.user.assessments.push(createdAssessmentID);
          this.user.isMentee = true;
          await DBSetWithID(
            "user",
            this.user.id,
            { isMentee: true, assessments: this.user.assessments },
            true
          );
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(err.message);
            return;
          }
          ErrorCallback("Something went wrong while creating assessment");
          return;
        }

        // send back id of newly created assessment
        callback(createdAssessmentID);
        console.log("created assessment", createdAssessmentID);
      } else if (action == "edit") {
        console.log("checkups0x");
        if (!id) {
          ErrorCallback("ID was not provided");
          return;
        }
        console.log("checkup444");
        // ensure assessment is valid
        if (!isValidAnsweredAssessmentQuestions(questions)) {
          ErrorCallback("Questions are not valid");
          return;
        }
        console.log("checkup152");

        // ensure assessment id belongs to current user.
        const assessmentRes = await DBGetWithID("assessment", id);
        if (!assessmentRes || assessmentRes["userID"] != this.user.id) {
          ErrorCallback(
            "You cannot edit this assessment, as it does not exist, or doesn't belong to you."
          );
          console.log("oascsj", assessmentRes);
          return;
        }
        console.log("checkup15");
        // update the assessment
        try {
          console.log("updatingAssessment", id, questions);
          await DBSetWithID("assessment", id, { questions }, true);
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(err.message);
            return;
          }
          ErrorCallback("Something went wrong while updating assessment");
          return;
        }
        callback(true);
      } else if (action == "delete") {
        if (!id) {
          ErrorCallback("ID was not provided");
          return;
        }
        // ensure assessment id belongs to current user.
        const assessmentRes = await DBGetWithID("assessment", id);
        if (!assessmentRes || assessmentRes["userID"] != this.user.id) {
          ErrorCallback(
            "You cannot delete this assessment, as it does not exist, or doesn't belong to you."
          );
          return;
        }

        // delete the assessment
        try {
          await DBDeleteWithID("assessment", id);
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(err.message);
            return;
          }
          ErrorCallback("Something went wrong while deleting assessment");
          return;
        }

        // remove assessment from account
        try {
          this.user.assessments.splice(this.user.assessments.indexOf(id), 1);
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(err.message);
            return;
          }
          ErrorCallback("Something went wrong while deleting assessment");
          return;
        }
      } else if (action == "publish" || action == "unpublish") {
        if (!id) {
          ErrorCallback("ID was not provided");
          return;
        }
        const targetPublishState = action == "publish" ? true : false;
        // ensure assessment id belongs to current user.
        const assessmentRes = await DBGetWithID("assessment", id);
        if (!assessmentRes || assessmentRes["userID"] != this.user.id) {
          ErrorCallback(
            "You cannot publish this assessment, as it does not exist, or doesn't belong to you."
          );
          return;
        }

        // ensure assessment isn't already published/unpublished
        if (assessmentRes["published"] == targetPublishState) {
          ErrorCallback(
            "You cannot " +
              action +
              " this assessment, as it is already " +
              action +
              "ed."
          );
          return;
        }

        // update the assessment, published = targetPublishedState
        try {
          await DBSetWithID(
            "assessment",
            id,
            { published: targetPublishState },
            true
          );
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(err.message);
            return;
          }
          ErrorCallback("Something went wrong while publishing assessment");
          return;
        }
      }
      callback(true);
    } catch (err) {
      if (err instanceof Error) {
        this.sendClientMessage(
          "Error",
          handleSubmitAssessmentHeader + err.message
        );
        return;
      }
      this.sendClientMessage(
        "Error",
        handleSubmitAssessmentHeader +
          "Something went wrong while handling mentorship request"
      );
      return;
    }
  }

  async handleMentorshipRequest(dataRaw: unknown, callback: unknown) {
    await this._updateSelf();
    const handleMentorshipRequestErrorHeader =
      "Error handling mentorship request action: ";
    try {
      if (!callback || typeof callback != "function") {
        this.sendClientMessage(
          "Error",
          handleMentorshipRequestErrorHeader + "No callback was provided"
        );
        return;
      }
      const ErrorCallback = (msg: string) => {
        this.sendClientMessage(
          "Error",
          handleMentorshipRequestErrorHeader + msg
        );
        callback(false);
      };

      if (!dataRaw || typeof dataRaw != "object") {
        ErrorCallback("Data is invalid.");
        return;
      }

      const data: ObjectAny = dataRaw;
      const {
        action,
        mentorID,
        mentorshipRequestID,
        menteeID: targetMenteeID,
      } = data;

      // ensure parameters are valid if they are given
      if (!action || !isValidMentorshipRequestAction(action)) {
        ErrorCallback("Action is invalid.");
        return;
      } else if (mentorID && typeof mentorID != "string") {
        ErrorCallback("MentorID is invalid");
        return;
      } else if (
        mentorshipRequestID &&
        typeof mentorshipRequestID != "string"
      ) {
        ErrorCallback("MentorshipRequestID is invalid");
        return;
      } else if (targetMenteeID && typeof targetMenteeID != "string") {
        ErrorCallback("MenteeID is not valid.");
        return;
      }

      if (action == "send") {
        if (mentorID == this.user.id) {
          ErrorCallback("You cannot send yourself a mentorship request.");
          return;
        }
        // determine if user exists, if they are a mentor, and if they are accepting mentees.
        try {
          const userRes = await DBGetWithID("user", mentorID);
          if (!userRes) {
            ErrorCallback("That user does not exist");
            return;
          } else if (!userRes["isMentor"]) {
            ErrorCallback("That user is not a mentor ");
            return;
          } else if (!userRes["acceptingMentees"]) {
            ErrorCallback("That user is not currently accepting mentees.");
            return;
          }
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(err.message);
            return;
          }
          ErrorCallback(
            "Something went wrong while sending mentorship request."
          );
          return;
        }

        // determine if you already have a request already exists between you and them
        const existingMR =
          await AuthenticatedSocket.FindMentorshipRequestBetweenMentorMentee(
            mentorID,
            this.user.id
          );
        if (existingMR) {
          ErrorCallback("You have already sent a request");
          return;
        }

        // by this point, request can be sent. Also send a copy to both mentor and mentee
        try {
          await AuthenticatedSocket.addMentorshipRequest(
            mentorID,
            this.user.id,
            this.testing
          );
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(err.message);
            return;
          }
          ErrorCallback(
            "Something went wrong while creating mentorshipRequest"
          );
          return;
        }
      } else if (action == "accept") {
        // determine if mentorshipRequest exists, and if the current user is the mentor
        let mentorshipRequestObj: ObjectAny;
        try {
          mentorshipRequestObj = await DBGetWithID(
            "mentorshipRequest",
            mentorshipRequestID
          );
          if (!mentorshipRequestObj) {
            ErrorCallback(
              "Action failed, that mentorship request does not exist."
            );
            return;
          }
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(
              "Encountered error while verifying request " + err.message
            );
            return;
          }
          ErrorCallback("Something went wrong while verifying request");
          return;
        }

        const { mentorID, menteeID } = mentorshipRequestObj;
        if (!mentorID || !menteeID) {
          ErrorCallback(
            "There is something wrong with this request. You cannot accept it."
          );
          // try deleting the request
          await AuthenticatedSocket.removeMentorshipRequest(
            mentorshipRequestID,
            "declined"
          );
          return;
        }
        if (mentorshipRequestObj.mentorID != this.user.id) {
          ErrorCallback("You do not have permission to accept this request.");
          return;
        }

        // delete request, send alert that it was accepted,
        // set mentee mentorID to this user's ID, and add mentee to this user's mentee list
        try {
          await AuthenticatedSocket.removeMentorshipRequest(
            mentorshipRequestID,
            "accepted"
          );
          await AuthenticatedSocket.addMentorship(mentorID, menteeID);
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(
              "Encountered error while accepting request " + err.message
            );
            return;
          }
          ErrorCallback("Something went wrong while accepting request");
          return;
        }
      } else if (action == "decline") {
        // determine if mentorshipRequest exists, and if the current user is the mentor
        let mentorshipRequestObj: ObjectAny;
        try {
          mentorshipRequestObj = await DBGetWithID(
            "mentorshipRequest",
            mentorshipRequestID
          );
          if (!mentorshipRequestObj) {
            ErrorCallback(
              "Action failed, that mentorship request does not exist."
            );
            return;
          }
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(
              "Encountered error while verifying request " + err.message
            );
            return;
          }
          ErrorCallback("Something went wrong while verifying request");
          return;
        }

        const { mentorID, menteeID } = mentorshipRequestObj;
        if (!mentorID || !menteeID) {
          ErrorCallback(
            "There is something wrong with this request. You cannot decline it."
          );
          // try deleting the request
          try {
            await DBDeleteWithID("mentorshipRequest", mentorshipRequestID);
          } catch (err) {
            console.error(
              "[pns9x] problem with deleting malformed mentorship request",
              err
            );
          }
          return;
        }

        // determine if current user is target mentor
        if (mentorshipRequestObj.mentorID != this.user.id) {
          ErrorCallback("You do not have permission to decline this request.");
          return;
        }

        // delete request, send alert that it was declined
        try {
          await AuthenticatedSocket.removeMentorshipRequest(
            mentorshipRequestID,
            "declined"
          );
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(
              "Encountered error while declining request " + err.message
            );
            return;
          }
          ErrorCallback("Something went wrong while declining request");
          return;
        }
      } else if (action == "cancel") {
        // determine if mentorshipRequest exists, and if the current user is the mentee
        let mentorshipRequestObj: ObjectAny;
        try {
          mentorshipRequestObj = await DBGetWithID(
            "mentorshipRequest",
            mentorshipRequestID
          );
          if (!mentorshipRequestObj) {
            ErrorCallback(
              "Action failed, that mentorship request does not exist."
            );
            return;
          }
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(
              "Encountered error while verifying request " + err.message
            );
            return;
          }
          ErrorCallback("Something went wrong while verifying request");
          return;
        }

        const { mentorID, menteeID } = mentorshipRequestObj;
        if (!mentorID || !menteeID) {
          ErrorCallback(
            "There is something wrong with this request. You cannot cancel it."
          );
          // try deleting the request
          try {
            await DBDeleteWithID("mentorshipRequest", mentorshipRequestID);
          } catch (err) {
            console.error(
              "[Xd-vak] problem with deleting malformed mentorship request",
              err
            );
          }
          return;
        }

        // determine if current user is target mentee
        if (menteeID != this.user.id) {
          ErrorCallback("You do not have permission to cancel this request.");
          return;
        }

        // delete request, send alert that it was cancelled
        try {
          await AuthenticatedSocket.removeMentorshipRequest(
            mentorshipRequestID,
            "cancelled"
          );
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(
              "Encountered error while cancelling request " + err.message
            );
            return;
          }
          ErrorCallback("Something went wrong while cancelling request");
          return;
        }
      } else if (action == "removeMentor") {
        // determine if current user has a mentor
        if (!this.user.mentorID) {
          ErrorCallback("You do not have a mentor");
          return;
        }

        // remove mentor from current, and remove mentee from mentor, send data update alert.
        try {
          await AuthenticatedSocket.removeMentorship(
            this.user.mentorID,
            this.user.id
          );
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(
              "Encountered error while removing mentorship " + err.message
            );
            return;
          }
          ErrorCallback("Something went wrong while removing mentorship");
          return;
        }
      } else if (action == "removeMentee") {
        // determine if current user has a mentor
        if (!this.user.menteeIDs) {
          ErrorCallback("You do not have mentees");
          return;
        } else if (!this.user.menteeIDs.includes(targetMenteeID)) {
          ErrorCallback("That is not one of your mentees.");
          return;
        }
        console.log(
          "removingMentee!!",
          this.user.id,
          targetMenteeID,
          this.user.menteeIDs
        );

        // remove mentor from current, and remove mentee from mentor, send data update alert.
        try {
          await AuthenticatedSocket.removeMentorship(
            this.user.id,
            targetMenteeID
          );
        } catch (err) {
          if (err instanceof Error) {
            ErrorCallback(
              "Encountered error while removing mentorship " + err.message
            );
            return;
          }
          ErrorCallback("Something went wrong while removing mentorship");
          return;
        }
      }
      callback(true);
    } catch (err) {
      if (err instanceof Error) {
        this.sendClientMessage(
          "Error",
          handleMentorshipRequestErrorHeader + err.message
        );
        return;
      }
      this.sendClientMessage(
        "Error",
        handleMentorshipRequestErrorHeader +
          "Something went wrong while handling mentorship request"
      );
      return;
    }
  }

  private async getFindMentorshipRequestBetweenUsers(mentorID: unknown, menteeID: unknown, callback: unknown) {
    const handleFindMentorshipRequestErrorHeaderBetween = 'Error while looking up mentorship status: ';
    function SendErrorMessage(msg: string) {
      this.sendClientMessage(
        "Error",
        handleFindMentorshipRequestErrorHeaderBetween +
          msg
      );
      return;
    }

    try {
      if (!callback || typeof(callback) != 'function') {
        SendErrorMessage('No callback provided');
        return;
      }
      const ErrorCallback = (msg: string) => {
        callback(false);
        SendErrorMessage(msg);
        return;
      }

      if (!mentorID || !menteeID) {
        ErrorCallback('Missing mentorID or menteeID');
        return;
      } else if (typeof(mentorID) != 'string' || typeof(menteeID) != 'string') {
        ErrorCallback('MentorID or menteeID format incorrect.');
        return;
      }
      
      const res = await AuthenticatedSocket.FindMentorshipRequestBetweenMentorMentee(mentorID, menteeID);
      callback(res);
    } catch (err) {
      if (err instanceof Error) {
        SendErrorMessage(err.message);
        return;
      }
      SendErrorMessage('Something went wrong.');
    }
  }

  private async handleGetAvailableAssessmentQuestions(callback: unknown) {
    const hGAAQErrorHeader =
      "Problem while getting available assessment questions: ";
    function SendErrorMessage(msg: string) {
      this.sendClientMessage("Error", hGAAQErrorHeader + msg);
    }
    try {
      if (!callback || typeof callback != "function") {
        SendErrorMessage("No callback provided");
        return;
      }

      const ErrorCallback = (msg: string) => {
        SendErrorMessage(msg);
        callback(false);
        return;
      };

      try {
        const dat = await GetAvailableAssessmentQuestions();
        callback(dat);
      } catch (err) {
        if (err instanceof Error) {
          ErrorCallback(err.message);
          return;
        }
        ErrorCallback(
          "Something went wrong while getting available assessments"
        );
        return;
      }
    } catch (err) {}
  }

  private static async addMentorship(mentorID: string, menteeID: string) {
    // get both mentor and mentee
    // get both mentor and mentee
    const mentorObj = await DBGetWithID("user", mentorID);
    if (!mentorObj) {
      throw new Error("Mentor does not exist");
    }
    const menteeObj = await DBGetWithID("user", menteeID);
    if (!menteeObj) {
      throw new Error("Mentee does not exist");
    }

    // add mentee to mentor's mentee list
    let mentorMenteeList: Array<string> = mentorObj.menteeIDs;
    if (!mentorMenteeList) {
      mentorMenteeList = [];
    }
    mentorMenteeList.push(menteeID);

    // update and send both
    await DBSetWithID("user", menteeID, { mentorID: mentorID }, true);
    await DBSetWithID("user", mentorID, { menteeIDs: mentorMenteeList }, true);
    console.log("added mentorship relation", menteeObj, mentorObj);
  }

  private static async removeMentorship(mentorID: string, menteeID: string) {
    // get both mentor and mentee
    const mentorObj = await DBGetWithID("user", mentorID);
    if (!mentorObj) {
      throw new Error("Mentor does not exist");
    }

    const menteeObj = await DBGetWithID("user", menteeID);
    if (!menteeObj) {
      throw new Error("Mentee does not exist");
    }

    // remove mentor from mentee
    menteeObj.mentorID = null;
    await DBSetWithID("user", menteeID, { mentorID: null }, true);

    // remove mentee from mentor's mentee list
    const mentorMenteeList: Array<string> = mentorObj.menteeIDs;
    if (!mentorMenteeList) {
      throw new Error("Mentor does not have any mentees");
    }

    try {
      mentorMenteeList.splice(mentorMenteeList.indexOf(menteeID), 1);
    } catch {
      throw new Error(
        "Cannot remove mentee. They are not one of the mentor's mentees."
      );
    }

    menteeObj.menteeIDs = mentorMenteeList;
    await DBSetWithID("user", mentorID, { menteeIDs: mentorMenteeList }, true);
    console.log("removed mentorship relation", menteeObj, mentorObj);
  }

  private static async addMentorshipRequest(
    mentorID: string,
    menteeID: string,
    testing: boolean
  ) {
    const mentorshipRequestObj: ObjectAny = {
      mentorID,
      menteeID,
    };
    testing && (mentorshipRequestObj.testing = true);

    const mentorshipRequestID = await DBCreate(
      "mentorshipRequest",
      mentorshipRequestObj
    );

    if (!mentorshipRequestID) {
      return;
    }

    await AuthenticatedSocket.addMentorshipRequestToUser(
      mentorshipRequestID,
      mentorID
    );
    await AuthenticatedSocket.addMentorshipRequestToUser(
      mentorshipRequestID,
      menteeID
    );

    AuthenticatedSocket.SendClientsDataWithUserID(
      [mentorID, menteeID],
      "mentorshipRequest",
      {
        ...mentorshipRequestObj,
        id: mentorshipRequestID,
      }
    );
  }

  private static async addMentorshipRequestToUser(
    mentorshipRequestID: string,
    userID: string
  ) {
    if (!userID) {
      return;
    }

    const userData = await DBGetWithID("user", userID);
    if (!userData) {
      return;
    }

    let { mentorshipRequests } = userData;
    if (!mentorshipRequests) {
      mentorshipRequests = [];
    } else if (mentorshipRequests && !(mentorshipRequests instanceof Array)) {
      console.error(`Mentorship request for ${userID} is invalid.`);
      mentorshipRequests = [];
    }

    try {
      mentorshipRequests.push(mentorshipRequestID);
      await DBSetWithID("user", userID, { mentorshipRequests }, true);
    } catch (err) {
      console.error(
        "Tried to add mentorship request from user, but they did not have it. " +
          err.message
      );
    }
  }

  private static async removeMentorshipRequest(
    mentorshipRequestID: string,
    alertStatus: string
  ) {
    if (!mentorshipRequestID) {
      return;
    }

    const mentorshipRequestObj = await DBGetWithID(
      "mentorshipRequest",
      mentorshipRequestID
    );
    if (!mentorshipRequestObj || typeof mentorshipRequestObj != "object") {
      return;
    }

    await DBDeleteWithID("mentorshipRequest", mentorshipRequestID);

    const { mentorID, menteeID } = mentorshipRequestObj;
    if (!mentorID || !menteeID) {
      console.error(
        "Something was wrong with the mentorship request",
        JSON.stringify(mentorshipRequestObj)
      );
      return;
    }

    await AuthenticatedSocket.removeMentorshipRequestFromUser(
      mentorshipRequestID,
      mentorID
    );
    await AuthenticatedSocket.removeMentorshipRequestFromUser(
      mentorshipRequestID,
      menteeID
    );

    AuthenticatedSocket.SendClientsDataWithUserID(
      [mentorID, menteeID],
      "mentorshipRequest",
      {
        ...mentorshipRequestObj,
        id: mentorshipRequestID,
        status: alertStatus,
      }
    );
  }

  private static async removeMentorshipRequestFromUser(
    mentorshipRequestID: string,
    userID: string
  ) {
    if (!userID) {
      return;
    }

    const userData = await DBGetWithID("user", userID);
    if (!userData) {
      return;
    }

    const { mentorshipRequests } = userData;
    if (!mentorshipRequests) {
      return;
    }

    if (!(mentorshipRequests instanceof Array)) {
      console.error(`Mentorship request for ${userID} is invalid.`);
      return;
    }

    try {
      mentorshipRequests.splice(
        mentorshipRequests.indexOf(mentorshipRequestID)
      );
      await DBSetWithID("user", userID, { mentorshipRequests }, true);
    } catch (err) {
      console.error(
        "Tried to remove mentorship request from user, but they did not have it. " +
          err.message
      );
    }
  }

  /**
   * Takes mentor and mentee userIDs and looks through their mentorshipRequests to see if they have any cross section.
   * If they do, then its either a mentor -> mentee request or mentee -> mentor request.
   *
   * We will request mentorshipRequest data for any cross section, and return the mentorshipRequest if they match mentorID menteeID.
   *
   * @param mentorID
   * @param menteeID
   * @returns mentorshipRequest or undefined
   */
  private static async FindMentorshipRequestBetweenMentorMentee(
    mentorID: string,
    menteeID: string
  ) {
    if (!mentorID || !menteeID) {
      return;
    }

    const mentorData = await DBGetWithID("user", mentorID);
    if (!mentorData) {
      return undefined;
    }
    const { mentorshipRequests: mentorMentorshipRequests } = mentorData;
    if (!mentorMentorshipRequests) {
      return undefined;
    }
    if (!(mentorMentorshipRequests instanceof Array)) {
      await DBSetWithID("user", mentorID, { mentorshipRequests: [] }, true);
      return undefined;
    }

    const menteeData = await DBGetWithID("user", menteeID);
    if (!menteeData) {
      return undefined;
    }
    const { mentorshipRequests: menteeMentorshipRequests } = menteeData;
    if (!menteeMentorshipRequests) {
      return undefined;
    }
    if (!(menteeMentorshipRequests instanceof Array)) {
      await DBSetWithID("user", menteeID, { mentorshipRequests: [] }, true);
      return undefined;
    }

    const set1 = new Set(mentorMentorshipRequests);
    const set2 = new Set(menteeMentorshipRequests);

    const iterSet = set1.size < set2.size ? set1 : set2;

    for (let mentorshipRequestID of iterSet.values()) {
      if (set2.has(mentorshipRequestID)) {
        const mentorshipRequestObj = await DBGetWithID(
          "mentorshipRequest",
          mentorshipRequestID
        );

        if (!mentorshipRequestObj) {
          // deletes mentorship request from both users if mentorship request does not exist.
          await AuthenticatedSocket.removeMentorshipRequestFromUser(
            mentorshipRequestID,
            menteeID
          );
          await AuthenticatedSocket.removeMentorshipRequestFromUser(
            mentorshipRequestID,
            mentorID
          );
          continue;
        }

        const { mentorID: reqMentorID, menteeID: reqMenteeID } =
          mentorshipRequestObj;
        if (!reqMenteeID || !reqMentorID) {
          // malformed request, delete
          await AuthenticatedSocket.removeMentorshipRequest(
            mentorshipRequestID,
            "declined"
          );
          continue;
        }

        if (reqMentorID == mentorID && reqMenteeID == menteeID) {
          // return if match found.
          return mentorshipRequestObj;
        }
      }
    }
    return undefined;
  }

  sendClientData(type: string, data: any) {
    this.socket.emit("data", { type, data });
  }

  /**
   * Uses global socket map `AllSockets` to send data to sockets with given userIDs
   * @param userIDs
   * @param type
   * @param data
   */
  static SendClientsDataWithUserID(userIDs: string[], type: string, data: any) {
    if (!(userIDs instanceof Array)) {
      return;
    }
    // iterates through each userID
    for (let userID of userIDs) {
      if (typeof userID != "string") {
        continue;
      }

      // gets all sockets with current userID
      const sockets = AuthenticatedSocket.AllSockets.get(userID);

      // skips if sockets no sockets with userID
      if (!sockets) {
        continue;
      }

      // if there are sockets with userID, sends data to those sockets
      for (let socket of sockets) {
        socket.sendClientData(type, data);
      }
    }
  }

  /**
   * This function fetches the target user data if the current user is allowed to.
   *
   * Depending on their relation, some data may not be available. If they are not related at all (mentee to mentee),
   * then they cannot see each other's data.
   * @param userID
   */
  private async _getUser(userID: unknown, callback: unknown) {
    console.log("_getUser", userID);
    await this._updateSelf();
    const GetUserErrorHeader = "Error while getting user: ";
    const SendErrorMessage = (msg: string) => {
      this.sendClientMessage("Error", GetUserErrorHeader + msg);
    };
    try {
      if (!callback || typeof callback != "function") {
        SendErrorMessage("No callback was provided");
        return;
      }

      const ErrorCallback = (msg: string) => {
        SendErrorMessage(msg);
        callback(false);
      };

      if (!userID || typeof userID != "string") {
        ErrorCallback("Invalid userID");
        return;
      }

      try {
        const data = await GetUserData(userID, this.user.id);
        callback(data);
        return;
      } catch (err) {
        ErrorCallback(err.message);
      }
    } catch (err) {
      if (err instanceof Error) {
        SendErrorMessage(err.message);
        return;
      }
      SendErrorMessage("Something went wrong while getting user");
      return;
    }
  }

  private async _getAssessment(assessmentID: unknown, callback: unknown) {
    await this._updateSelf();
    const GetUserErrorHeader = "Error while getting assessment: ";
    const SendErrorMessage = (msg: string) => {
      this.sendClientMessage("Error", GetUserErrorHeader + msg);
    };
    try {
      if (!callback || typeof callback != "function") {
        SendErrorMessage("No callback was provided");
        return;
      }

      const ErrorCallback = (msg: string) => {
        SendErrorMessage(msg);
        callback(false);
      };

      if (!assessmentID || typeof assessmentID != "string") {
        ErrorCallback("Invalid assessmentID: " + assessmentID);
        return;
      }

      try {
        const data = await GetAssessmentData(assessmentID, this.user.id);
        callback(data);
        return;
      } catch (err) {
        ErrorCallback(err.message);
      }
    } catch (err) {
      if (err instanceof Error) {
        SendErrorMessage(err.message);
        return;
      }
      SendErrorMessage("Something went wrong while getting user");
      return;
    }
  }

  /**
   * adds event function pair to socket.
   * also adds it to `currentSocketStateEvents` to keep track of current socket events (used by ``_cleanupSocketEvents``).
   * @param event
   * @param func
   */
  private _addStateSocketEvent(event: string, func: (...args: any[]) => void) {
    this.currentSocketStateEvents[event] = func;
    this.socket.on(event, func);
  }
  /**
   * Remove all socket events listed in ```this.currentSocketStateEvents``` from the socket.
   */
  private _cleanupSocketEvents() {
    for (let key in this.currentSocketStateEvents) {
      this.socket.removeListener(key, this.currentSocketStateEvents[key]);
    }
  }

  /**
   * Enables a socket event that allows client to update a variable
   */
  private _enableTestingListeners() {
    const errorHeader = "Cannot set testing variable, ";
    this.socket.on(
      "setTestingVariable",
      (variable: string, val: unknown, callback: (...args: any[]) => void) => {
        if (!callback || typeof callback != "function") {
          this.sendClientMessage(
            "Error",
            errorHeader + "no callback was provided"
          );
          return;
        } else if (!variable || typeof variable != "string") {
          this.sendClientMessage(
            "Error",
            errorHeader + "invalid variable name provided"
          );
          return;
        }
        this.socketEventTestingVariables.set(variable, val);
        callback(true);
      }
    );
  }

  private addSelfToSocketMap() {
    if (this.inAllSockets || !this.user || !this.user.id) {
      // do not add socket if already in map, or if no userID is present
      console.error(
        "Could not add socket to socket map",
        this.inAllSockets,
        this.user,
        this.user?.id
      );
      return;
    }

    // add to existing list if it exists
    const socketList = AuthenticatedSocket.AllSockets.get(this.user.id);
    if (socketList) {
      socketList.push(this);
    }
    // otherwise, start a new list
    else {
      AuthenticatedSocket.AllSockets.set(this.user.id, [this]);
    }
    this.inAllSockets = true;
  }

  private removeSelfFromSocketMap() {
    if (!this.user.id || !this.inAllSockets) {
      return;
    }
    this.inAllSockets = false;
    const socketList = AuthenticatedSocket.AllSockets.get(this.user.id);

    if (!socketList) {
      // interestingly, not in socket list. Not sure how this is possibile
      return;
    } else if (socketList.length == 1) {
      // if the list will be empty after this operation, remove list entirely.
      AuthenticatedSocket.AllSockets.delete(this.user.id);
      return;
    }

    try {
      // this is an unsafe action, but should work.
      socketList.splice(socketList.indexOf(this), 1);
    } catch {}
  }

  private async _updateSelf() {
    try {
      const self = await DBGetWithID("user", this.user.id);
      if (!self) {
        this.sendClientMessage("Error", "Your account does not exist");
        this.socket.disconnect();
        return;
      }
      this.user = self;
    } catch {
      console.error("Fatal error, could not update self.");
      this.sendClientMessage("Error", "There was a problem syncing your data.");
      this.socket.disconnect();
      return;
    }
  }

  /**
   * Updates the mentor list set.
   * Used to keep track of all mentorIDs.
   *
   * Calling this once, then maintaining sync of AllAcceptingMentorIDs will
   * allow handleGetAllMentors to get all mentors via cache (reducing database reads)
   *
   * This is supposed to be called once at the beginning of the socket server.
   */
  static async SyncAllAcceptingMentorIDs() {
    // get all people with isMentor = true
    const allMentors = await DBGet(
      "user",
      [
        ["isMentor", "==", true],
        ["acceptingMentees", "==", true],
      ],
      "and"
    );

    // create a new set to add these mentor IDs to
    const newAllMentorIDsSet = new Set<string>();

    // process each mentor, ensuring they are a mentor and accepting mentors
    for (let mentor of allMentors) {
      const { id, isMentor, acceptingMentees } = mentor;

      if (!id || !isMentor || !acceptingMentees) {
        continue;
      }
      newAllMentorIDsSet.add(id);
    }

    // set AllAcceptingMentorIDs to the new set.
    AuthenticatedSocket.AllAcceptingMentorIDs = newAllMentorIDsSet;
  }

  private removeSelfFromAcceptingMentorIDsList() {
    AuthenticatedSocket.AllAcceptingMentorIDs.delete(this.user.id);
  }

  private addSelfToAcceptingMentorIDsList() {
    AuthenticatedSocket.AllAcceptingMentorIDs.add(this.user.id);
  }
}

// required to call once when socket server starts.
AuthenticatedSocket.SyncAllAcceptingMentorIDs();

/**
 * Removes all confidential information from a given user, letting it be viewable to the public.
 * @param user
 */
function ModifyUserForPublic(user: ObjectAny) {
  const userCopy = JSON.parse(JSON.stringify(user)) as Object;
  delete user.isMentee;
  delete user.MentorID;
  delete user.assessments;
  delete user.OAuthSubID;
  return userCopy;
}

async function GetUserMentorshipRequests(userID: string) {
  try {
    return await DBGet(
      "mentorshipRequest",
      [
        ["mentorID", "==", userID],
        ["menteeID", "==", userID],
      ],
      "or"
    );
  } catch {
    return [];
  }
}

/**
 * This function returns the target userData with the information that is visible to the requestingUser.
 *
 * if no requestingUserID is provided, then the targetUser data is returned as it is.
 *
 * Otherwise, depending on relationship between requesting user and targetUser, some information will be removed before being returned.
 * @param targetUserID
 * @param requestingUserID
 * @returns
 */
async function GetUserData(targetUserID: string, requestingUserID?: string) {
  let userData: DBObj;
  let selfData: DBObj;

  let userDataRaw = await DBGetWithID("user", targetUserID);
  if (!userDataRaw) {
    throw new Error("Requested user does not exist");
  }
  if (!requestingUserID) {
    return userDataRaw;
  }
  userData = { ...userDataRaw };

  selfData = await DBGetWithID("user", requestingUserID);
  if (!selfData) {
    throw new Error("Self user doesn't exist");
  }

  const { mentorID: userMentorID } = userData;

  // check if this is ourself
  if (userData.id == selfData.id) {
    // if so, send userData.
    return userData;
  }

  // no users should have access to our mentee list except for ourselves.
  // no use knowing we are a mentee either.
  delete userData.menteeIDs;
  delete userData.isMentee;

  // no one should access our OAuthSubID or email either
  delete userData.OAuthSubID;
  delete userData.email;

  // check if target user is our mentee
  if (userMentorID == userData.id) {
    return userData;
  }

  // target user is not a mentee. Delete mentee data
  delete userData.assessments;
  delete userData.mentorID;

  return userData;
}

/**
 * This function returns the target assessmentData if the requesting party is allowed to see it (mentor).
 *
 * if no requestingUserID is provided, then the targetUser data is returned automatically.
 *
 * Otherwise, the assessment is returned depending on if the
 * assessment taker and the requester are mentor and mentee (or self)
 * @param targetUserID
 * @param requestingUserID
 * @returns
 */
async function GetAssessmentData(
  assessmentID: string,
  requestingUserID?: string
) {
  let assessmentData = await DBGetWithID("assessment", assessmentID);
  if (!assessmentData) {
    throw new Error("The requested assessment does not exist.");
  }
  if (!requestingUserID) {
    // if no requesting userID was passed, then return auto.
    return assessmentData;
  }

  const { userID: assessmentUserID } = assessmentData;
  if (!assessmentUserID) {
    throw new Error(
      "There's something wrong with the assessment you requested."
    );
  }

  // taker is the requesting user.
  if (requestingUserID == assessmentUserID) {
    return assessmentData;
  }

  // check if requesting user is mentor of assessment taker
  let requestingUserData = await DBGetWithID("user", requestingUserID);
  if (!requestingUserData) {
    throw new Error("The requesting user does not exist.");
  }

  let modifiedAssessmentData: Object;
  if (assessmentData.published) {
    modifiedAssessmentData = assessmentData;
  } else {
    modifiedAssessmentData = { published: false, id: assessmentID };
  }

  const { menteeIDs } = requestingUserData;
  if (
    menteeIDs &&
    menteeIDs instanceof Array &&
    menteeIDs.includes(assessmentUserID)
  ) {
    return modifiedAssessmentData;
  }

  throw new Error("You do not have permission to view this assessment");
}

async function GetAvailableAssessmentQuestions() {
  try {
    return await DBGet("assessmentQuestion");
  } catch (err) {
    console.error("Error in GetAvailableAssessmentQuestions", err);
    return [];
  }
}
