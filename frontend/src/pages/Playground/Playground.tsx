
import MinimalisticButton from '../../components/MinimalisticButton/MinimalisticButton';
import { useDispatch } from 'react-redux';
import { addDialog, closeDialog } from '../../features/Dialog/DialogSlice';
import env from '../../scripts/env';

export default function Playground() {
  const dispatch = useDispatch();

  function TryFileDialog() {
    dispatch(addDialog({
      title: 'Upload a file',
      subtitle: 'Please upload a file using the input below.',
      inputs: [
        {
          label: 'Select File',
          type: 'file',
          name: 'uploadedFile',
        }
      ],
      buttons: [
        {
          text: 'Submit',
        
          onClick: (inputs, enableCallback) => {
            console.log('File input dialog submitted with inputs:', inputs);
            enableCallback();
            dispatch(closeDialog());
          },
          useDisableTill: true
        }
      ]
    }));
  }

  // Only show playground in dev mode
  if (!env.DEV) {
    return null;
  }

  return (
    <>
      <div
      className={'pageBase'}
      >
        <MinimalisticButton onClick={TryFileDialog}>Try File Dialog</MinimalisticButton>
      </div>
    </>
  );
}
