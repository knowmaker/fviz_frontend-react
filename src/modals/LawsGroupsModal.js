import React, { useEffect, useState, useContext } from 'react';
import setStateFromGetAPI, { postDataToAPI, patchDataToAPI, deleteDataFromAPI } from '../misc/api.js';
import { UserProfile, SystemTypeContext } from '../misc/contexts.js';
import { EditorState } from 'draft-js';
import { isResponseSuccessful } from '../misc/api.js';
import { RichTextEditor } from '../components/RichTextEditor.js';
import { convertMarkdownFromEditorState } from '../pages/Home.js';
import { showMessage } from '../misc/message.js';
import { convertMarkdownToEditorState } from '../misc/converters.js';
import { Modal } from './Modal.js';
import { Button } from '../components/ButtonWithLoad.js';

const API_BASE = () => process.env.REACT_APP_API_LINK;

export function LawsGroupsModal({ modalsVisibility, lawsGroupsState, lawsState }) {
  const userInfoState = useContext(UserProfile);
  const systemTypeState = useContext(SystemTypeContext);

  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`,
  };
  const lawsGroups = lawsGroupsState.lawsGroups;
  const setLawsGroups = lawsGroupsState.setLawsGroups;

  let isAdmin = false;
  if (userInfoState.userProfile) {
    isAdmin = userInfoState.userProfile.is_admin;
  }

  const [selectedLawGroup, setSelectedLawGroup] = useState({ name: null, id: null, color: null });
  const [lawGroupEditorState, setLawGroupEditorState] = useState(EditorState.createEmpty());

  useEffect(() => {
    if (modalsVisibility.lawsGroupsModalVisibility.isVisible === false && isAdmin) {
      convertMarkdownToEditorState(setLawGroupEditorState, "");
      document.getElementById("InputLawGroupColor3").value = "#000000";
    }
    if (modalsVisibility.lawsGroupsModalVisibility.isVisible === false) {
      setSelectedLawGroup({ name: null, id: null, color: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalsVisibility.lawsGroupsModalVisibility.isVisible]);

  const selectLawGroup = async (group) => {
    convertMarkdownToEditorState(setLawGroupEditorState, group.name);
    document.getElementById("InputLawGroupColor3").value = group.color;
    setSelectedLawGroup(group);
  };

  const updateButtonClick = async () => {
    const selectedLawGroupUpdated = {
      ...selectedLawGroup,
      name: convertMarkdownFromEditorState(lawGroupEditorState).split("/n").join(""),
    };
    if (!await updateLawGroup(selectedLawGroupUpdated)) {
      return;
    }
    setStateFromGetAPI(setLawsGroups, `${API_BASE()}/law_groups/by-system-type/${systemTypeState.currentSystemTypeId}`, undefined, headers);
    showMessage("Группа была обновлена");
  };

  const createButtonClick = async () => {
    let selectedLawGroupUpdated = {
      ...selectedLawGroup,
      color: document.getElementById("InputLawGroupColor3").value,
      name: convertMarkdownFromEditorState(lawGroupEditorState).split("/n").join(""),
    };
    const createResult = await createLawGroup(selectedLawGroupUpdated);
    if (!createResult) {
      return;
    }
    selectedLawGroupUpdated = {
      ...selectedLawGroupUpdated,
      id: createResult.id,
    };
    if (!await updateLawGroup(selectedLawGroupUpdated)) {
      return;
    }
    setStateFromGetAPI(setLawsGroups, `${API_BASE()}/law_groups/by-system-type/${systemTypeState.currentSystemTypeId}`, undefined, headers);
    setLawGroupEditorState(EditorState.createEmpty());
    document.getElementById("InputLawGroupColor3").value = "#FF0000";
    showMessage("Группа была создана");
  };

  const updateLawGroup = async (lawGroup) => {
    const payload = {
      name: lawGroup.name,
      color: lawGroup.color,
    };
    const changedGroupResponseData = await patchDataToAPI(`${API_BASE()}/law_groups/${lawGroup.id}`, payload, headers);
    if (!isResponseSuccessful(changedGroupResponseData)) {
      showMessage(changedGroupResponseData.data?.detail || changedGroupResponseData.data?.error, "error");
      return false;
    }
    return true;
  };

  const deleteLawGroup = async (group) => {
    if (!window.confirm("Вы уверены что хотите это сделать? Это приведёт к последствиям для других пользователей.")) {
      return;
    }
    const groupDeleteResponseData = await deleteDataFromAPI(`${API_BASE()}/law_groups/${group.id}`, undefined, headers);
    if (!isResponseSuccessful(groupDeleteResponseData)) {
      showMessage(groupDeleteResponseData.data?.detail || groupDeleteResponseData.data?.error, "error");
      return;
    }
    setStateFromGetAPI(setLawsGroups, `${API_BASE()}/law_groups/by-system-type/${systemTypeState.currentSystemTypeId}`, undefined, headers);
    setStateFromGetAPI(lawsState.setLaws, `${API_BASE()}/laws/by-system-type/${systemTypeState.currentSystemTypeId}`, undefined, headers);
    showMessage("Группа была удалена");
  };

  const createLawGroup = async (lawGroup) => {
    const newLawGroup = {
      name: lawGroup.name,
      color: lawGroup.color,
      system_type_id: systemTypeState.currentSystemTypeId,
    };
    const newGroupResponseData = await postDataToAPI(`${API_BASE()}/law_groups`, newLawGroup, headers);
    if (!isResponseSuccessful(newGroupResponseData)) {
      showMessage(newGroupResponseData.data?.detail || newGroupResponseData.data?.error, "error");
      return false;
    }
    return newGroupResponseData.data;
  };

  const updateColor = async () => {
    setSelectedLawGroup({
      ...selectedLawGroup,
      color: document.getElementById("InputLawGroupColor3").value
    });
  };

  let lawsGroupsMarkup;
  if (lawsGroups) {
    lawsGroupsMarkup = lawsGroups.map(group => {
      const isCurrent = selectedLawGroup.id === group.id;
      return (
        <tr key={group.id}>
          {isAdmin ? (
            <>
              <th scope="row" className='small-cell'>{isCurrent ? '+' : ''}</th>
            </>
          ) : null}
          <td dangerouslySetInnerHTML={{ __html: group.name }}></td>
          <td><input type="color" className="form-control form-control-color disabled" value={group.color} readOnly onClick={(e) => { e.preventDefault(); }} /></td>
          {isAdmin ? (
            <>
              <td className='small-cell'><button type="button" className="btn btn-primary btn-sm" onClick={() => selectLawGroup(group)}>📝</button></td>
              <td className='small-cell'><button type="button" className="btn btn-danger btn-sm" onClick={() => deleteLawGroup(group)}>🗑</button></td>
            </>
          ) : null}
        </tr>
      );
    });
  } else {
    lawsGroupsMarkup = null;
  }

  return (
    <Modal
      modalVisibility={modalsVisibility.lawsGroupsModalVisibility}
      title="Группы законов"
      hasBackground={false}
      sizeX={600}
    >
      <div className="modal-content2">
        {isAdmin ? (
          <>
            <div className="row mb-2">
              <div className="col-2">
                Название:
              </div>
              <div className="col">
                <RichTextEditor editorState={lawGroupEditorState} setEditorState={setLawGroupEditorState} />
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-2">
                Цвет:
              </div>
              <div className="col-5">
                <input type="color" className="form-control form-control-color" id="InputLawGroupColor3" onChange={updateColor} />
              </div>
            </div>
            <div className="row">
              <div className="col-2">
                <Button type="button" className="btn btn-success" onClick={(e) => createButtonClick(e)}>Создать</Button>
              </div>
              <div className="col-3">
                <Button type="button" className="btn btn-info" onClick={(e) => updateButtonClick(e)}>Обновить</Button>
              </div>
            </div>
          </>
        ) : null}

        <table className="table">
          <thead>
            <tr>
              {isAdmin ? (
                <>
                  <th scope="col">#</th>
                </>
              ) : null}
              <th scope="col">Название</th>
              <th scope="col">Цвет</th>
              {isAdmin ? (
                <>
                  <th scope="col">Выбрать</th>
                  <th scope="col">Удалить</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {lawsGroupsMarkup}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

