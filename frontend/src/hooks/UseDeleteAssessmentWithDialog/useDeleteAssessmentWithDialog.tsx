import { useDispatch, useSelector } from "react-redux";
import { closeDialog, setDialog } from "../../features/Dialog/DialogSlice";
import { unixToDateString } from "../../scripts/tools";
import { ReduxRootState } from "../../store";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";
import { setAlert } from "../../features/Alert/AlertSlice";

export default function useDeleteAssessmentWithDialog() {
  const dispatch = useDispatch();
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);

  function deleteAssessmentWithDialog(id: string, callback?: Function) {
    if (!user || !user.assessments || !user.assessments[id] || Object.keys(user.assessments).length < 2) {
      callback && callback(false);
      return;
    }
    const previewAssessmentObj = user.assessments[id];
    dispatch(setDialog({
      title: 'Delete Assessment '+unixToDateString(previewAssessmentObj.date),
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
            MyClientSocket.SubmitAssessment({ id, action: 'delete' }).then((v: boolean|string) => {
              callback && callback(v);
              cb && cb();
              if (!v) {
                return;
              }
              dispatch(closeDialog());
              dispatch(setAlert({ title: 'Assessment Deleted', body: 'Successfully deleted assessment' }));
            });
          }
        }
      ],
      buttonContainerStyle: {
        justifyContent: 'end'
      }
    }))
  }

  return deleteAssessmentWithDialog;
}