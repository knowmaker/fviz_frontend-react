import React, { useEffect, useState, useContext } from 'react';
import setStateFromGetAPI, { putDataToAPI, getDataFromAPI } from '../misc/api.js';
import { UserProfile } from '../misc/contexts.js';
import { EditorState } from 'draft-js';
import { isResponseSuccessful } from '../misc/api.js';
import { RichTextEditor } from '../components/RichTextEditor.js';
import { convertMarkdownFromEditorState } from '../pages/Home.js';
import { showMessage } from '../misc/message.js';
import { convertMarkdownToEditorState } from '../misc/converters.js';
import { Modal } from './Modal.js';
import { Button } from '../components/ButtonWithLoad.js';

const API_BASE = () => process.env.REACT_APP_API_LINK;

export function GKLayersModal({ modalsVisibility, GKLayersState }) {

  const userInfoState = useContext(UserProfile);
  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`
  };
  const GKLayers = GKLayersState.gkColors;
  const setGKLayers = GKLayersState.setGkColors;

  const [selectedGKLayer, setSelectedGKLayer] = useState({ ru: { gk_name: null }, id_gk: null, color: null });
  const [GKLayerEditorState, setGKLayerEditorState] = useState(EditorState.createEmpty());

  let isAdmin = false;
  if (userInfoState.userProfile) {
    isAdmin = userInfoState.userProfile.role;
  }

  useEffect(() => {
    if (modalsVisibility.GKColorsEditModalVisibility.isVisible === false && isAdmin) {
      convertMarkdownToEditorState(setGKLayerEditorState, "");
      document.getElementById("InputGKLayerColor3").value = "#000000";
    }
    if (modalsVisibility.GKColorsEditModalVisibility.isVisible === false) {
      setSelectedGKLayer({ ru: { gk_name: null }, id_gk: null, color: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalsVisibility.GKColorsEditModalVisibility.isVisible]);

  const selectGKLayer = async (layer) => {
    const selectedLayer = {
      ...layer,
      gk_name: null,
      ru: { gk_name: layer.gk_name },
    };
    convertMarkdownToEditorState(setGKLayerEditorState, selectedLayer.ru.gk_name);
    document.getElementById("InputGKLayerColor3").value = selectedLayer.color;
    setSelectedGKLayer(selectedLayer);
  };

  const updateButtonClick = async () => {
    const selectedLayerUpdated = {
      ...selectedGKLayer,
      ru: {
        gk_name: convertMarkdownFromEditorState(GKLayerEditorState).split("/n").join("")
      },
    };
    if (!await updateLayer(selectedLayerUpdated)) {
      return;
    }
    setStateFromGetAPI(setGKLayers, `${API_BASE()}/gk`, undefined, headers);
    showMessage("Системный уровень обновлен");
  };

  const updateLayer = async (layer) => {
    const GKLayerColor = layer.color;
    const GKLayerName = layer.ru.gk_name;
    const newLawGroup = {
      gk: {
        gk_name: GKLayerName,
        color: GKLayerColor,
      }
    };
    const changedGKLayerResponseData = await putDataToAPI(`${API_BASE()}/gk/${selectedGKLayer.id_gk}`, newLawGroup, headers);
    if (!isResponseSuccessful(changedGKLayerResponseData)) {
      showMessage(changedGKLayerResponseData.data.error, "error");
      return false;
    }
    return true;
  };

  const updateColor = async () => {
    setSelectedGKLayer({
      ...selectedGKLayer,
      color: document.getElementById("InputGKLayerColor3").value
    });
  };

  let GKLayersMarkup;
  if (GKLayers) {
    GKLayersMarkup = GKLayers.map(GKLayer => {
      const isCurrent = selectedGKLayer.id_gk === GKLayer.id_gk;
      return (
        <tr key={GKLayer.id_gk}>
          {isAdmin ?
            (<>
              <th scope="row" className='small-cell'>{isCurrent ? `+` : ""}</th>
            </>) : (null)}
          <td dangerouslySetInnerHTML={{ __html: GKLayer.gk_name }}></td>
          <td>G<sup>{GKLayer.g_indicate}</sup>K<sup>{GKLayer.k_indicate}</sup></td>
          <td><input type="color" className="form-control form-control-color disabled" value={GKLayer.color} readOnly onClick={(e) => { e.preventDefault(); }} /></td>
          {isAdmin ?
            (<>
              <td className='small-cell'><button type="button" className="btn btn-primary btn-sm" onClick={() => selectGKLayer(GKLayer)}>📝</button></td>
            </>) : (null)}
        </tr>
      );
    });
  } else {
    GKLayersMarkup = null;
  }

  return (
    <Modal
      modalVisibility={modalsVisibility.GKColorsEditModalVisibility}
      title="Системные уровни"
      hasBackground={false}
      sizeX={600}
    >
      <div className="modal-content2">
        {isAdmin ?
          (<>
            <div className="row mb-2">
              <div className="col-2">
                Название:
              </div>
              <div className="col">
                <RichTextEditor editorState={GKLayerEditorState} setEditorState={setGKLayerEditorState} />
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-2">
                Цвет:
              </div>
              <div className="col-5">
                <input type="color" className="form-control form-control-color" id="InputGKLayerColor3" onChange={updateColor} />
              </div>
            </div>
            <div className="row">
              <div className="col-2">
                <Button type="button" className="btn btn-info" onClick={(e) => updateButtonClick(e)}>Обновить</Button>
              </div>
            </div>
          </>) : (null)}

        <table className="table">
          <thead>
            <tr>
              {isAdmin ?
                (<>
                  <th scope="col">#</th>
                </>) : (null)}
              <th scope="col">Имя</th>
              <th scope="col">GK</th>
              <th scope="col">Цвет</th>
              {isAdmin ?
                (<>
                  <th scope="col">Выбрать</th>
                </>) : (null)}
            </tr>
          </thead>
          <tbody>
            {GKLayersMarkup}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
