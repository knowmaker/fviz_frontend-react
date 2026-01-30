import React, { useEffect, useContext } from 'react';
import setStateFromGetAPI, { postDataToAPI, putDataToAPI, deleteDataFromAPI } from '../misc/api.js';
import { UserProfile } from '../misc/contexts.js';
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
  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`
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
    if (selectedLawState.selectedLaw.id_law) {
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

    const selectedLawCellId = selectedLawState.selectedLaw.cells.map(cell => cell.id_value);

    const newLaw = {
      law: {
        law_name: convertMarkdownFromEditorState(lawEditorsStates.lawNameEditorState.value),
        first_element: selectedLawCellId[0],
        second_element: selectedLawCellId[1],
        third_element: selectedLawCellId[2],
        fourth_element: selectedLawCellId[3],
        id_type: document.getElementById("inputLawGroup3").value !== "-1" ? document.getElementById("inputLawGroup3").value : null
      }
    };

    const newLawResponseData = await postDataToAPI(`${API_BASE()}/laws`, newLaw, headers);
    if (!isResponseSuccessful(newLawResponseData)) {
      showMessage(newLawResponseData.data.error, "error");
      return;
    }

    setStateFromGetAPI(lawsState.setLaws, `${API_BASE()}/laws`, undefined, headers);

    selectedLawState.setSelectedLaw({
      ...newLawResponseData.data.data,
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

    const selectedLawCellId = selectedLawState.selectedLaw.cells.map(cell => cell.id_value);

    const newLaw = {
      law: {
        law_name: convertMarkdownFromEditorState(lawEditorsStates.lawNameEditorState.value),
        first_element: selectedLawCellId[0],
        second_element: selectedLawCellId[1],
        third_element: selectedLawCellId[2],
        fourth_element: selectedLawCellId[3],
        id_type: document.getElementById("inputLawGroup3").value !== "-1" ? document.getElementById("inputLawGroup3").value : null
      }
    };

    const changedLawResponseData = await putDataToAPI(`${API_BASE()}/laws/${selectedLawState.selectedLaw.id_law}`, newLaw, headers);
    if (!isResponseSuccessful(changedLawResponseData)) {
      showMessage(changedLawResponseData.data.error, "error");
      return;
    }

    setStateFromGetAPI(lawsState.setLaws, `${API_BASE()}/laws`, undefined, headers);

    showMessage("Закон обновлён");

  };

  const deleteLaw = async (e) => {

    if (!window.confirm("Вы уверены что хотите это сделать?")) {
      return;
    }

    const law = selectedLawState.selectedLaw;

    const lawDeleteResponseData = await deleteDataFromAPI(`${API_BASE()}/laws/${law.id_law}`, undefined, headers);
    if (!isResponseSuccessful(lawDeleteResponseData)) {
      showMessage(lawDeleteResponseData.data.error, "error");
      return;
    }

    setStateFromGetAPI(lawsState.setLaws, `${API_BASE()}/laws`, undefined, headers);

    showMessage("Закон удалён");

    modalsVisibility.lawsModalVisibility.setVisibility(false)

  };

  const chooseOption = <option key={-1} value={-1}>Выберите опцию</option>;

  const lawsGroupList = lawsGroupsState.lawsGroups.map(lawGroup => {

    const shownText = `${lawGroup.type_name}`;

    return (
      <option key={lawGroup.id_type} value={lawGroup.id_type} dangerouslySetInnerHTML={{ __html: shownText }} />
    );

  });

  const allOptions = [chooseOption, ...lawsGroupList];

  const selectedLaw = selectedLawState.selectedLaw;


  const lawFormulaSymbols = selectedLaw.cells.length >= 4 ? `${selectedLaw.cells[0].symbol} * ${selectedLaw.cells[2].symbol} = ${selectedLaw.cells[1].symbol} * ${selectedLaw.cells[3].symbol}` : "";
  const lawFormulaNames = selectedLaw.cells.length >= 4 ? `${selectedLaw.cells[0].value_name} * ${selectedLaw.cells[2].value_name} = <br> = ${selectedLaw.cells[1].value_name} * ${selectedLaw.cells[3].value_name}` : "";

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
        {selectedLaw.id_law ?
          (<>
            <Button type="button" className="btn btn-danger" onClick={(e) => deleteLaw(e)}>Удалить</Button>
          </>) : (null)}
      </div>

    </Modal>
  );
}
