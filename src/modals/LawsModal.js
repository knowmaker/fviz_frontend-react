import React, { useEffect, useContext } from 'react';
import setStateFromGetAPI, { postDataToAPI, patchDataToAPI, deleteDataFromAPI } from '../misc/api.js';
import { UserProfile, SystemTypeContext } from '../misc/contexts.js';
import { isResponseSuccessful } from '../misc/api.js';
import { checkLaw } from '../components/Table.js';
import { RichTextEditor } from '../components/RichTextEditor.js';
import { convertMarkdownFromEditorState } from '../pages/Home.js';
import { showMessage } from '../misc/message.js';
import { Modal } from './Modal.js';
import { Button } from '../components/ButtonWithLoad.js';

const API_BASE = () => process.env.REACT_APP_API_LINK;

export function EditLawsModal({ modalsVisibility, lawsState, selectedLawState, lawsGroupsState, lawEditorsStates }) {
  const userInfoState = useContext(UserProfile);
  const systemTypeState = useContext(SystemTypeContext);

  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`,
  };

  useEffect(() => {
    if (lawEditorsStates.lawGroupEditorState.value === null) {
      document.getElementById("inputLawGroup3").value = -1;
      return;
    }
    if (lawEditorsStates.lawGroupEditorState.value) {
      document.getElementById("inputLawGroup3").value = lawEditorsStates.lawGroupEditorState.value;
    }
  }, [lawEditorsStates.lawGroupEditorState.value]);

  const saveButtonClick = () => {
    if (selectedLawState.selectedLaw.id) {
      updateLaw();
      return;
    }
    createLaw();
  };

  const createLaw = async () => {

    if (selectedLawState.selectedLaw.cells.length !== 4) {
      showMessage("Для закона нужно выбрать 4 ячейки");
      return;
    }

    if (!checkLaw(selectedLawState.selectedLaw.cells)) {
      showMessage("выбран некорректный закон");
      return;
    }

    const selectedLawCellId = selectedLawState.selectedLaw.cells.map(cell => cell.id);
    const newLaw = {
      name: convertMarkdownFromEditorState(lawEditorsStates.lawNameEditorState.value),
      first_quantity_id: selectedLawCellId[0],
      second_quantity_id: selectedLawCellId[1],
      third_quantity_id: selectedLawCellId[2],
      fourth_quantity_id: selectedLawCellId[3],
      law_group_id: document.getElementById("inputLawGroup3").value !== "-1" ? document.getElementById("inputLawGroup3").value : null,
      system_type_id: systemTypeState.currentSystemTypeId,
    };

    const newLawResponseData = await postDataToAPI(`${API_BASE()}/laws`, newLaw, headers);
    if (!isResponseSuccessful(newLawResponseData)) {
      showMessage(newLawResponseData.data?.detail || newLawResponseData.data?.error, "error");
      return;
    }

    setStateFromGetAPI(lawsState.setLaws, `${API_BASE()}/laws/by-system-type/${systemTypeState.currentSystemTypeId}`, undefined, headers);

    selectedLawState.setSelectedLaw({
      ...newLawResponseData.data,
      cells: selectedLawState.selectedLaw.cells,
    });

    showMessage("Закон создан");
  };

  const updateLaw = async () => {
    if (selectedLawState.selectedLaw.cells.length !== 4) {
      showMessage("Для закона нужно выбрать 4 ячейки");
      return;
    }

    if (!checkLaw(selectedLawState.selectedLaw.cells)) {
      showMessage("выбран некорректный закон");
      return;
    }

    const selectedLawCellId = selectedLawState.selectedLaw.cells.map(cell => cell.id);
    const updatePayload = {
      name: convertMarkdownFromEditorState(lawEditorsStates.lawNameEditorState.value),
      law_group_id: document.getElementById("inputLawGroup3").value !== "-1" ? document.getElementById("inputLawGroup3").value : null,
    };

    const changedLawResponseData = await patchDataToAPI(`${API_BASE()}/laws/${selectedLawState.selectedLaw.id}`, updatePayload, headers);
    if (!isResponseSuccessful(changedLawResponseData)) {
      showMessage(changedLawResponseData.data?.detail || changedLawResponseData.data?.error, "error");
      return;
    }

    setStateFromGetAPI(lawsState.setLaws, `${API_BASE()}/laws/by-system-type/${systemTypeState.currentSystemTypeId}`, undefined, headers);

    showMessage("Закон обновлён");

  };

  const deleteLaw = async (e) => {

    if (!window.confirm("Вы уверены что хотите это сделать?")) {
      return;
    }

    const law = selectedLawState.selectedLaw;

    const lawDeleteResponseData = await deleteDataFromAPI(`${API_BASE()}/laws/${law.id}`, undefined, headers);
    if (!isResponseSuccessful(lawDeleteResponseData)) {
      showMessage(lawDeleteResponseData.data?.detail || lawDeleteResponseData.data?.error, "error");
      return;
    }

    setStateFromGetAPI(lawsState.setLaws, `${API_BASE()}/laws/by-system-type/${systemTypeState.currentSystemTypeId}`, undefined, headers);

    showMessage("Закон удалён");

    modalsVisibility.lawsModalVisibility.setVisibility(false);
  };

  const chooseOption = <option key={-1} value={-1}>Выберите опцию</option>;

  const lawsGroupList = lawsGroupsState.lawsGroups.map(lawGroup => {

    const shownText = `${lawGroup.name}`;

    return (
      <option key={lawGroup.id} value={lawGroup.id} dangerouslySetInnerHTML={{ __html: shownText }} />
    );
  });

  const allOptions = [chooseOption, ...lawsGroupList];

  const selectedLaw = selectedLawState.selectedLaw;


  const lawFormulaSymbols = selectedLaw.cells.length >= 4 ? `${selectedLaw.cells[0].symbol} * ${selectedLaw.cells[2].symbol} = ${selectedLaw.cells[1].symbol} * ${selectedLaw.cells[3].symbol}` : "";
  const lawFormulaNames = selectedLaw.cells.length >= 4 ? `${selectedLaw.cells[0].name} * ${selectedLaw.cells[2].name} = <br> = ${selectedLaw.cells[1].name} * ${selectedLaw.cells[3].name}` : "";

  return (
    <Modal
      modalVisibility={modalsVisibility.lawsModalVisibility}
      title="Законы"
      hasBackground={false}
      sizeX={600}
    >
      <div className="modal-content2">
        <div className="row mb-1">
          <div className="col-2">
            Название:
          </div>
          <div className="col">
            <RichTextEditor editorState={lawEditorsStates.lawNameEditorState.value} setEditorState={lawEditorsStates.lawNameEditorState.set} />
          </div>
        </div>
        <div className="row">
          <div className="col-2">
            Группы:
          </div>
          <div className="col">
            <select className="form-select" aria-label="Default select example" id='inputLawGroup3'>
              {allOptions}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col-2">
            Формулы:
          </div>
          <div className="col">
            <div className="" dangerouslySetInnerHTML={{ __html: lawFormulaSymbols }} />
          </div>
        </div>
        <div className="row">
          <div className="col-2 invisible">
            Формулы:
          </div>
          <div className="col">
            <div className="" dangerouslySetInnerHTML={{ __html: lawFormulaNames }} />
          </div>
        </div>
      </div>

      <div className="modal-footer2">
        <Button type="button" className="btn btn-success me-1" onClick={(e) => saveButtonClick(e)}>Сохранить</Button>
        {selectedLaw.id ? (
          <>
            <Button type="button" className="btn btn-danger" onClick={(e) => deleteLaw(e)}>Удалить</Button>
          </>
        ) : null}
      </div>
    </Modal>
  );
}

