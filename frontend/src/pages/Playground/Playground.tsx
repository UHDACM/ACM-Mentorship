
import MinimalisticInput from '../../components/MinimalisticInput/MinimalisticInput';
import MinimalisticTextArea from '../../components/MinimalisticTextArea/MinimalisticTextArea';
import { useState } from 'react';
import MinimalisticButton from '../../components/MinimalisticButton/MinimalisticButton';
import useWarnNavigation from '../../hooks/UseWarnNavigation/useWarnNavigation';

export default function Playground() {
  const [enabled, setOn] = useState(true);
  useWarnNavigation({ enabled })

  return (
    <>
      <div
      className={'pageBase'}
      >
        <MinimalisticInput placeholder='Work' disabled={!true}/>
        <MinimalisticTextArea/>
        
        <MinimalisticButton onClick={() => setOn(!enabled)}>Warn: {enabled ? 'True' : 'False'}</MinimalisticButton>
      </div>
    </>
  );
}
