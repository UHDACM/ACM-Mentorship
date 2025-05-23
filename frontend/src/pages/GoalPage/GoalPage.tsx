import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoalObj, TaskObj, FunctionAny, UserObj } from "@shared/types/general";

import MinimalisticInput from "../../components/MinimalisticInput/MinimalisticInput";
import {
  ArrowBigDown,
  ArrowBigUp,
  Check,
  Pencil,
  Trash,
  X,
} from "lucide-react";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";
import { useDispatch, useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import { setAlert } from "../../features/Alert/AlertSlice";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import { SaveButtonFixed } from "../../components/SaveButtonFixed/SaveButtonFixed";
import { closeDialog, setDialog } from "../../features/Dialog/DialogSlice";
import Calendar from "react-calendar";
import { unixToDateString } from "../../scripts/tools";
import MinimalisticTextArea from "../../components/MinimalisticTextArea/MinimalisticTextArea";
import styles from "./GoalPage.module.css";
import useTutorialWithDialog from "../../hooks/UseTutorialWithDialog/useTutorialWithDialog";
import { FaRegQuestionCircle } from "react-icons/fa";
import { GoalPageContext, GoalPageProvider } from "./GoalPageContext";

export default function GoalPageWithContext() {
  return (
    <GoalPageProvider>
      <GoalPage />
    </GoalPageProvider>
  );
}

export function GoalPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params, _] = useSearchParams();
  const originalGoal = useRef<GoalObj | boolean | undefined>({});
  const id = params.get("id");
  const newParam = params.get("new");
  const isNew = newParam == "true";

  const {
    saving,
    setSaving,
    changed,
    setChanged,
    goal,
    setGoal,
    goalOwner,
    setGoalOwner,
  } = useContext(GoalPageContext);

  const { user: self, ready } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  const ShowTutorial = useTutorialWithDialog();

  function handleOnReset() {
    setGoal(originalGoal.current);
    setChanged(false);
  }

  const pageIsInvalid = (!id && !isNew) || (id && isNew);
  // fetches goal if id is present, and owner
  useEffect(() => {
    if (pageIsInvalid || !MyClientSocket) {
      // this doesn't make sense.
      return;
    }

    if (isNew) {
      setGoalOwner(self);
      setGoal({
        name: "New Goal",
        tasks: [],
      });
      return;
    } else if (id) {
      // fetch for goal, then fetch for owner of goal.
      MyClientSocket.GetGoal(id).then((v: false | GoalObj) => {
        setGoal(v);
        originalGoal.current = v;
        if (typeof v == "boolean") {
          return;
        }
        const { userID } = v;
        if (!userID) {
          dispatch(
            setAlert({
              title: "Goal retrieval error",
              body: "Goal is malformed",
            })
          );
          return;
        }
        MyClientSocket!.GetUser(userID).then((v: boolean | UserObj) => {
          setGoalOwner(v);
        });
      });
    } else {
      // doesn't make sense.
    }
  }, [id, ready]);

  if (!self || !MyClientSocket) {
    return <p>Waiting for your data...</p>;
  }

  if (pageIsInvalid) {
    return <p>URL doesn't make sense.</p>;
  }

  if (typeof goal == "boolean") {
    return <p>Goal does not exist</p>;
  }

  if (!goal) {
    return <p>Goal is loading...</p>;
  }

  if (typeof goalOwner == "boolean") {
    return <p>Goal owner does not exist</p>;
  } else if (!goalOwner) {
    return <p>Getting goal owner information...</p>;
  }

  const selfIsOwner = self.id == goalOwner.id;

  const setGoalName = (name: string) => {
    setGoal({ ...goal, name });
    setChanged(true);
  };

  const handleOnSaveClick = () => {
    if (!MyClientSocket || !selfIsOwner) {
      return;
    }
    dispatch(
      setDialog({
        title: `${isNew ? "Create" : "Save"} Goal`,
        subtitle: isNew
          ? "This will create a goal. You sure you want to do this?"
          : "This will save your current goal information. All previous data will be overritted and cannot be undone",
        buttonContainerStyle: {
          width: "100%",
          justifyContent: "space-between",
        },
        buttons: [
          {
            text: "On second thought...",
          },
          {
            text: isNew ? "Create" : "Save",
            style: {
              backgroundColor: "#26610E",
              color: "#ddd",
            },
            useDisableTill: true,
            onClick: (_, cb) => {
              dispatch(closeDialog());
              if (!MyClientSocket) {
                cb && cb();
                return;
              }
              setSaving(true);
              const action = isNew ? "create" : "edit";
              MyClientSocket.SubmitGoal({
                action,
                id: id || undefined,
                goal,
              }).then((v: boolean | string) => {
                cb && cb();
                setSaving(false);
                if (typeof v == "boolean") {
                  if (v) {
                    dispatch(
                      setAlert({
                        title: "Success",
                        body: `Successfully saved goal`,
                      })
                    );
                    setChanged(false);
                    originalGoal.current = goal;
                  }
                  return;
                }
                navigate(`/app/goal?id=${v}`, { replace: true });
                dispatch(
                  setAlert({
                    title: "Success",
                    body: `Successfully created goal`,
                  })
                );
                setSaving(false);
                setChanged(false);
                originalGoal.current = goal;
              });
            },
          },
        ],
      })
    );
  };

  const { name } = goal;
  const { fName, mName, lName } = goalOwner;

  const handleOnBack = () => {
    navigate(-1);
  };

  return (
    <div className={"pageBase"}>
      <SaveButtonFixed
        onSave={handleOnSaveClick}
        onReset={handleOnReset}
        disabled={!selfIsOwner || isNew}
        show={changed}
        saving={saving}
      />
      <MinimalisticButton
        style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}
        onClick={handleOnBack}
      >
        Back
      </MinimalisticButton>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <MinimalisticInput
            value={name || "New Goal"}
            style={{ margin: 0, fontSize: "1.5rem", minWidth: "2rem" }}
            disabled={!selfIsOwner}
            onChange={setGoalName}
          />
          {selfIsOwner && (
            <Pencil style={{ marginLeft: 10 }} size={"1.25rem"} />
          )}
        </div>
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: 0, marginLeft: 10 }}>
            by{" "}
            <span style={{ fontWeight: "bold" }}>
              {fName} {mName} {lName}
            </span>
          </p>
        </div>
        <MinimalisticButton
          style={{
            marginBottom: "1rem",
            cursor: "pointer",
          }}
          onClick={() => ShowTutorial("goals")}
        >
          How do goals work?{" "}
          <FaRegQuestionCircle style={{ marginLeft: "0.3rem" }} />
        </MinimalisticButton>

        <p style={{ margin: 0, fontSize: "1.25rem" }}>Tasks</p>
        <div style={{ marginLeft: 10 }}>
          <TasksSection
            disabled={!selfIsOwner}
            // tasks={tasks}
            // setTasks={setTasks}
          />
        </div>
      </div>
      {selfIsOwner && isNew && (
        <MinimalisticButton
          onClick={handleOnSaveClick}
          style={{ marginTop: 10 }}
        >
          Create Goal
        </MinimalisticButton>
      )}
    </div>
  );
}

function TasksSection({ disabled }: { disabled: boolean }) {
  const { goal, setGoal, setChanged } = useContext(GoalPageContext);
  const dispatch = useDispatch();
  // type guard for tasks
  if (typeof goal === "boolean" || !goal) {
    return null;
  }

  const { tasks } = goal;

  const setTasks = (tasks: TaskObj[]) => {
    setGoal({ ...goal, tasks });
    setChanged(true);
  };

  function handleAddTask() {
    const newTasks = [...(tasks || [])];
    const newTask: TaskObj = {
      name: "New Task",
      description: "Task description",
    };

    newTasks.push(newTask);
    setTasks(newTasks);
  }

  function handleEditTask(tIndex: number, newTask: TaskObj) {
    if (!tasks) {
      return;
    }
    const newTasks = [...tasks];
    newTasks[tIndex] = newTask;
    setTasks(newTasks);
  }

  function handleMoveTask(tIndex: number, up: boolean) {
    if (!tasks) {
      return;
    }
    if ((tIndex == tasks.length - 1 && !up) || (tIndex == 0 && up)) {
      console.log("nah");
      return;
    }
    let targetIndex = tIndex + (up ? -1 : 1);
    const newTasks = [...tasks];
    const temp = newTasks[targetIndex];
    newTasks[targetIndex] = newTasks[tIndex];
    newTasks[tIndex] = temp;
    setTasks(newTasks);
  }

  function handleDeleteTask(tIndex: number) {
    if (!tasks) {
      return;
    }

    function delTask() {
      if (!tasks) {
        return;
      }
      const newTasks = [...tasks];
      newTasks.splice(tIndex, 1);
      setTasks(newTasks);
    }

    dispatch(
      setDialog({
        title: 'Delete task "' + tasks[tIndex].name + '"',
        subtitle:
          "This will remove this task. After you save, this cannot be undone.",
        buttonContainerStyle: { justifyContent: "end" },
        buttons: [
          {
            text: "Delete",
            onClick: () => {
              delTask();
              dispatch(closeDialog());
            },
            style: {
              color: "white",
              backgroundColor: "#d22",
            },
          },
        ],
      })
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "start" }}
    >
      {tasks?.map((task, tIndex) => {
        return (
          <div key={`task_${tIndex}`} style={{ margin: 5 }}>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginRight: "0.5rem",
                }}
              >
                {tIndex != 0 && (
                  <div
                    onClick={() => handleMoveTask(tIndex, true)}
                    style={{
                      padding: "0.25rem",
                      border: "1px solid #fff2",
                      backgroundColor: "#333",
                      borderTopLeftRadius: "0.5rem",
                      borderTopRightRadius: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    {<ArrowBigUp size={"1.5rem"} />}
                  </div>
                )}
                {tIndex != tasks.length - 1 && (
                  <div
                    onClick={() => handleMoveTask(tIndex, false)}
                    style={{
                      padding: "0.25rem",
                      border: "1px solid #fff2",
                      backgroundColor: "#333",
                      borderBottomLeftRadius: "0.5rem",
                      borderBottomRightRadius: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    {<ArrowBigDown size={"1.5rem"} />}
                  </div>
                )}
              </div>
              <Task
                task={task}
                setTask={(task: TaskObj) => handleEditTask(tIndex, task)}
                onDelete={() => handleDeleteTask(tIndex)}
                disabled={disabled}
              />
            </div>
          </div>
        );
      })}
      {(!tasks || tasks.length == 0) && (
        <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>No tasks</span>
      )}
      {!disabled && (
        <MinimalisticButton style={{ marginTop: 10 }} onClick={handleAddTask}>
          Add Task +
        </MinimalisticButton>
      )}
      <div style={{ height: "10vh" }} />
    </div>
  );
}

function Task({
  task,
  setTask,
  onDelete,
  disabled,
}: {
  task: TaskObj;
  setTask: (v: TaskObj) => any;
  onDelete: FunctionAny;
  disabled: boolean;
}) {
  const [openCalendar, setOpenCalendar] = useState(false);
  const { name, description, completitionDate } = task;

  function handleChangeName(newName: string) {
    setTask({ name: newName, description, completitionDate });
  }

  function handleChangeDescription(newDesc: string) {
    setTask({ name, description: newDesc, completitionDate });
  }

  function handleChangeCompletionDate(newDate: number | undefined) {
    if (newDate) {
      setTask({ name, description, completitionDate: newDate });
    } else {
      setTask({ name, description });
    }
  }

  function handleDaySelect(v?: Date) {
    handleChangeCompletionDate(v?.getTime());
    setOpenCalendar(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "end" }}>
        <MinimalisticInput
          disabled={disabled}
          onChange={handleChangeName}
          value={name || "New Task"}
          style={{ minWidth: "3rem", fontWeight: "bold", fontSize: "1.25rem" }}
        />
        <div style={{ display: "flex", marginLeft: "0.5rem" }}>
          <span
            onClick={() => !disabled && setOpenCalendar(true)}
            style={{
              borderBottom: "1px #fff4 solid",
              cursor: disabled ? "initial" : "pointer",
            }}
          >
            {completitionDate
              ? unixToDateString(completitionDate)
              : "Not Complete"}
          </span>
          {completitionDate && (
            <Check style={{ marginLeft: "0.1rem" }} color={"#0a0"} />
          )}
        </div>
        {!disabled && (
          <Trash
            onClick={onDelete}
            size={"1.25rem"}
            style={{
              marginLeft: "0.5rem",
              cursor: "pointer",
              marginBottom: "0.2rem",
            }}
          />
        )}
      </div>
      <div style={{ marginLeft: 10 }}>
        <MinimalisticTextArea
          disabled={disabled}
          onChange={handleChangeDescription}
          value={description}
          placeholder="Task Description"
        />
      </div>
      {openCalendar && (
        <SelectDayOverlay
          onClickDay={handleDaySelect}
          onCancel={() => setOpenCalendar(false)}
        />
      )}
    </div>
  );
}

function SelectDayOverlay({
  onClickDay,
  onCancel,
}: {
  onClickDay?: (d?: Date) => any;
  onCancel?: FunctionAny;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: 30,
        boxSizing: "border-box",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#0004",
        position: "fixed",
        inset: 0,
        backdropFilter: "blur(2px)",
        zIndex: 10,
      }}
    >
      <div
        style={{
          boxSizing: "border-box",
          maxWidth: "90vw",
          padding: "1.25rem",
          backgroundColor: "#444",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "end",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "1.5rem", textAlign: "start" }}>
            Completition Date
          </span>
          <X size={"2rem"} style={{ cursor: "pointer" }} onClick={onCancel} />
        </div>
        <Calendar
          className={styles.CalendarAdjustment}
          calendarType="hebrew"
          onClickDay={(v) => onClickDay && onClickDay(v)}
        />
        <button
          onClick={() => onClickDay && onClickDay(undefined)}
          style={{
            marginTop: 10,
            fontSize: "1.25rem",
            width: "100%",
            backgroundColor: "#777",
            color: "#ddd",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
        >
          Not Complete
        </button>
      </div>
    </div>
  );
}
