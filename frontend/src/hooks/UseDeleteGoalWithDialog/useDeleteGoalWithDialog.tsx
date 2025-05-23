import { useDispatch, useSelector } from "react-redux";
import { closeDialog, setDialog } from "../../features/Dialog/DialogSlice";
import { ReduxRootState } from "../../store";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";
import { setAlert } from "../../features/Alert/AlertSlice";

export default function useDeleteGoalWithDialog() {
  const dispatch = useDispatch();
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);

  function deleteGoalWithDialog(id: string, callback?: Function) {
    if (!user || !user.goals || !user.goals[id]) {
      callback && callback(false);
      return;
    }
    const previewAssessmentObj = user.goals[id];
    dispatch(setDialog({
      title: 'Delete Goal \"'+previewAssessmentObj.name+'\"',
      subtitle: 'You cannot undo this.',
      buttons: [
        {
          style: {
            background: '#d22',
            color: '#eee'
          },
          text: 'Delete',
          useDisableTill: true,
          onClick: (_, cb) => {
            if (!MyClientSocket) {
              cb && cb();
              return;
            }
            MyClientSocket.SubmitGoal({ id, action: 'delete' }).then((v: boolean|string) => {
              callback && callback(v);
              cb && cb();
              if (!v) {
                return;
              }
              dispatch(closeDialog());
              dispatch(setAlert({ title: 'Goal Deleted', body: 'Successfully deleted goal' }));
            });
          }
        }
      ],
      buttonContainerStyle: {
        justifyContent: 'end'
      }
    }))
  }

  return deleteGoalWithDialog;
}