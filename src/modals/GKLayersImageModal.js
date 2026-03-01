import React from 'react';

export function GKLayersImage({ modalVisibility }) {

  if (modalVisibility.isVisible) {
    return (
      // <Modal
      //   modalVisibility={modalVisibility}
      //   title="Соотношение уровней GK"
      //   sizeX={600}
      // >
      //   <div className="modal-content2">
  
      //   </div>
  
      // </Modal>
            <div className="data-window gk-levels-image-window">
            <div className="data-window-top">
            <span></span>
            <button type="button" className="btn-close" onClick={() => modalVisibility.setVisibility(false)}></button>
            </div>
            <img src="/image.png" alt="Loading" className='GK-layers-image' />
          </div>
    );
  } else {
    return null
  }

}
