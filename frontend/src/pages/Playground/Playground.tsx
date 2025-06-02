
import MinimalisticButton from '../../components/MinimalisticButton/MinimalisticButton';
import { useDispatch } from 'react-redux';
import { addDialog, addDialogImmediate, closeDialog } from '../../features/Dialog/DialogSlice';

export default function Playground() {
  const dispatch = useDispatch();

  function AddFiveDialogsPlusPriority() {
    for (let i = 0; i < 5; i++) {
      dispatch(addDialog(
        {
          title: `Dialog ${i + 1}`,
          buttons: [
            {
              text: 'ADD PRIORITY',
              onClick: () => {
                dispatch(addDialogImmediate({
                  title: 'Priority Dialog',
                  showDelay: 1000,
                }));
                dispatch(closeDialog());
              }
            }
          ]
        }
      ));
    }
  }

  return (
    <>
      <div
      className={'pageBase'}
      >
        <MinimalisticButton onClick={AddFiveDialogsPlusPriority}>Add 5 Dialogs</MinimalisticButton>
      </div>
    </>
  );
}
