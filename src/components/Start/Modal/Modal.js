import { useState } from 'react';
import { createPortal } from 'react-dom';
import TownSelector from '../TownSelector';

export default function Modal() {
    const [showModal, setShowModal] = useState(false);
    return (
      <>
        <button onClick={() => setShowModal(true)}>
            Button
        </button>
        {showModal && createPortal(
          <TownSelector onClose={() => setShowModal(false)} />,
          document.getElementById('modal-root')
        )}
      </>
    );
  }
  