import React, { useEffect, useState, useContext } from 'react';
import { getDataFromAPI, postDataToAPI, patchDataToAPI, deleteDataFromAPI } from '../misc/api.js';
import { UserProfile, TableContext } from '../misc/contexts.js';
import { Cell } from '../components/Table.js';
import { isResponseSuccessful } from '../misc/api.js';
import { convertMarkdownFromEditorState } from '../pages/Home.js';
import { showMessage } from '../misc/message.js';
import { convertToMLTI, convertNumberToUnicodePower } from '../misc/converters.js';
import { convertMarkdownToEditorState } from '../misc/converters';
import { SELECTED_SYSTEM_TYPE_ID } from '../misc/constants';
import { Modal } from './Modal.js';
import { RichTextEditor } from '../components/RichTextEditor.js';
import { Button } from '../components/ButtonWithLoad.js';

const API_BASE = () => process.env.REACT_APP_API_LINK;

export function EditCellModal({ modalVisibility, selectedCell, cellEditorsStates, gkColors, selectedCellState }) {

  const tableState = useContext(TableContext);
  const userInfoState = useContext(UserProfile);
  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`
  };

  let isAdmin = false;
  if (userInfoState.userProfile) {
    isAdmin = userInfoState.userProfile.is_admin;
  }

  const [currentModalLocaleFields, setCurrentModalLocaleFields] = useState(null);

  useEffect(() => {

    if (selectedCellState.selectedCell) {
      setCurrentModalLocaleFields({
        ...currentModalLocaleFields,
        gk_id: selectedCellState.selectedCell.gk_id,
        l_indicate: selectedCellState.selectedCell.l_indicate,
        t_indicate: selectedCellState.selectedCell.t_indicate,
        symbol: selectedCellState.selectedCell.symbol,
        ru: {
          name: selectedCellState.selectedCell.name,
          unit: selectedCellState.selectedCell.unit,
        }
      })
    }

  }, [selectedCellState.selectedCell]);

  useEffect(() => {
    if (modalVisibility.isVisible === false) {
      selectedCellState.setSelectedCell(null)
      setCurrentModalLocaleFields(null)
      convertMarkdownToEditorState(cellEditorsStates.cellNameEditorState.set, "")
      convertMarkdownToEditorState(cellEditorsStates.cellSymbolEditorState.set, "")
      convertMarkdownToEditorState(cellEditorsStates.cellUnitEditorState.set, "")
      document.getElementById("inputL3").value = null
      document.getElementById("inputT3").value = null
      document.getElementById("inputGK3").value = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalVisibility.isVisible]);

  const saveButtonClick = async () => {

    if (!selectedCell) {
      showMessage("Сначала выберите ячейку на поле", "error")
      return
    }

    const currentModalLocaleFieldsUpdated = {
      ...currentModalLocaleFields,
      gk_id: parseInt(document.getElementById("inputGK3").value),
      l_indicate: parseInt(document.getElementById("inputL3").value),
      t_indicate: parseInt(document.getElementById("inputT3").value),
      symbol: convertMarkdownFromEditorState(cellEditorsStates.cellSymbolEditorState.value).split("/n").join(""),
      ru: {
        name: convertMarkdownFromEditorState(cellEditorsStates.cellNameEditorState.value).split("/n").join(""),
        unit: convertMarkdownFromEditorState(cellEditorsStates.cellUnitEditorState.value).split("/n").join(""),
      }
    }

    setCurrentModalLocaleFields(currentModalLocaleFieldsUpdated)

    if (selectedCell.id === -1) {
      const createdCellData = await createCell(currentModalLocaleFieldsUpdated);
      if (createdCellData) {
        tableState.setTableData(tableState.tableData.filter(cell => cell.lt_id !== createdCellData.lt_id).concat(createdCellData));
        modalVisibility.setVisibility(false);
      }
      return;
    }

    const updated = await updateCell(currentModalLocaleFieldsUpdated, selectedCell.id);
    if (updated) {
      showMessage("Ячейка была изменена");
    }
  };

  const updateCell = async (currentModalFields, cellId) => {
    const gk_id = currentModalFields.gk_id;
    const gkLevel = gkColors.find(g => g.id === gk_id);
    const G_indicate = gkLevel.g_indicate;
    const K_indicate = gkLevel.k_indicate;
    const l_indicate = currentModalFields.l_indicate;
    const t_indicate = currentModalFields.t_indicate;
    const M_indicate = 0 - (G_indicate * -1 + K_indicate);
    const L_indicate = l_indicate - G_indicate * 3;
    const T_indicate = t_indicate - G_indicate * -2;
    const I_indicate = 0 - K_indicate * -1;

    const newCell = {
      name: currentModalFields.ru.name,
      symbol: currentModalFields.symbol,
      unit: currentModalFields.ru.unit,
      m_indicate: String(M_indicate),
      l_indicate: String(L_indicate),
      t_indicate: String(T_indicate),
      i_indicate: String(I_indicate),
      gk_id,
      lt_id: selectedCell.lt_id,
    };

    const changedCellResponseData = await patchDataToAPI(`${API_BASE()}/quantities/${cellId}`, newCell, headers);
    if (!isResponseSuccessful(changedCellResponseData)) {
      showMessage(changedCellResponseData.data?.detail || changedCellResponseData.data?.error, "error");
      return false;
    }
    const cellData = changedCellResponseData.data;

    tableState.setTableData(tableState.tableData.filter(cell => cell.id !== cellData.id).concat(cellData));

    const cellAlternativesResponseData = await getDataFromAPI(`${API_BASE()}/quantities/by-system-type/${SELECTED_SYSTEM_TYPE_ID}/by-lt/${selectedCell.lt_id}`, headers);
    if (isResponseSuccessful(cellAlternativesResponseData)) {
      const cellAlternatives = cellAlternativesResponseData.data;
      if (cellAlternatives.length > 0 && cellData.lt_id !== selectedCell.lt_id) {
        tableState.setTableData(tableState.tableData.filter(cell => cell.id !== cellData.id).concat(cellData).filter(cell => cell.lt_id !== selectedCell.lt_id).concat(cellAlternatives[0]));
      }
    }

    modalVisibility.setVisibility(false);
    return true;
  };

  const createCell = async (currentModalFields) => {
    const gk_id = currentModalFields.gk_id;
    const gkLevel = gkColors.find(g => g.id === gk_id);
    const G_indicate = gkLevel.g_indicate;
    const K_indicate = gkLevel.k_indicate;
    const l_indicate = currentModalFields.l_indicate;
    const t_indicate = currentModalFields.t_indicate;
    const M_indicate = 0 - (G_indicate * -1 + K_indicate);
    const L_indicate = l_indicate - G_indicate * 3;
    const T_indicate = t_indicate - G_indicate * -2;
    const I_indicate = 0 - K_indicate * -1;

    const newCell = {
      name: currentModalFields.ru.name,
      symbol: currentModalFields.symbol,
      unit: currentModalFields.ru.unit,
      m_indicate: String(M_indicate),
      l_indicate: String(L_indicate),
      t_indicate: String(T_indicate),
      i_indicate: String(I_indicate),
      gk_id,
      lt_id: selectedCell.lt_id,
      system_type_id: SELECTED_SYSTEM_TYPE_ID,
    };

    const createdCellResponseData = await postDataToAPI(`${API_BASE()}/quantities`, newCell, headers);
    if (!isResponseSuccessful(createdCellResponseData)) {
      showMessage(createdCellResponseData.data?.detail || createdCellResponseData.data?.error, "error");
      return null;
    }
    return createdCellResponseData.data;
  };

  const deleteCell = async () => {

    if (!selectedCell) {
      showMessage("Сначала выберите ячейку на поле", "error")
      return
    }

    if (!window.confirm("Вы уверены что хотите это сделать? Это приведёт к последствиям для других пользователей.")) {
      return;
    }

    const cellDeleteResponseData = await deleteDataFromAPI(`${API_BASE()}/quantities/${selectedCell.id}`, undefined, headers);
    if (!isResponseSuccessful(cellDeleteResponseData)) {
      showMessage(cellDeleteResponseData.data?.detail || cellDeleteResponseData.data?.error, "error");
      return;
    }

    tableState.setTableData(tableState.tableData.filter(cell => cell.id !== selectedCell.id));

    const cellAlternativesResponseData = await getDataFromAPI(`${API_BASE()}/quantities/by-system-type/${SELECTED_SYSTEM_TYPE_ID}/by-lt/${selectedCell.lt_id}`, headers);
    if (isResponseSuccessful(cellAlternativesResponseData)) {
      const cellAlternatives = cellAlternativesResponseData.data;
      if (cellAlternatives.length > 0) {
        tableState.setTableData(tableState.tableData.filter(cell => cell.id !== selectedCell.id).concat(cellAlternatives[0]));
      }
    }

    showMessage("Ячейка удалена");
    modalVisibility.setVisibility(false);
  };

  const cellList = gkColors.map(gkLevel => {
    const shownText = `${gkLevel.name} G${convertNumberToUnicodePower(gkLevel.g_indicate)}K<sup>${convertNumberToUnicodePower(gkLevel.k_indicate)}</sup>`;
    return (
      <option key={gkLevel.id} value={gkLevel.id} dangerouslySetInnerHTML={{ __html: shownText }} />
    );
  });

  const [previewCell, setPreviewCell] = useState({
    cellFullId: -1,
    cellData: { name: "не выбрано", symbol: "", unit: "" },
    cellColor: undefined
  });

  const [GKoption, setGKoption] = useState(null);

  useEffect(() => {
    updatePreviewCell();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellEditorsStates, GKoption, selectedCell]);

  const updatePreviewCell = () => {
    const gk_id = parseInt(document.getElementById("inputGK3").value);
    if (gk_id) {
      const gkLevel = gkColors.find(g => g.id === gk_id);
      const cellColor = gkLevel.color;
      const G_indicate = gkLevel.g_indicate;
      const K_indicate = gkLevel.k_indicate;
      const l_indicate = parseInt(document.getElementById("inputL3").value) || 0;
      const t_indicate = parseInt(document.getElementById("inputT3").value) || 0;
      const M_indicate = 0 - (G_indicate * -1 + K_indicate);
      const L_indicate = l_indicate - G_indicate * 3;
      const T_indicate = t_indicate - G_indicate * -2;
      const I_indicate = 0 - K_indicate * -1;
      setPreviewCell({
        cellFullId: -1,
        cellData: {
          name: convertMarkdownFromEditorState(cellEditorsStates.cellNameEditorState.value),
          symbol: convertMarkdownFromEditorState(cellEditorsStates.cellSymbolEditorState.value),
          unit: convertMarkdownFromEditorState(cellEditorsStates.cellUnitEditorState.value),
          m_indicate: String(M_indicate),
          l_indicate: String(L_indicate),
          t_indicate: String(T_indicate),
          i_indicate: String(I_indicate),
        },
        cellColor: cellColor,
      });
    }
  };

  return (
    <Modal
      modalVisibility={modalVisibility}
      title="Редактирование величины"
      hasBackground={false}
      sizeX={650}
    >
      <div className="modal-content2">
        {isAdmin ?
          (<>
            <div className="row">
              <details>
                <summary>Превью</summary>
                <Cell cellFullData={previewCell} />
              </details>
            </div>
          </>) : (null)}

        <div className="row">
          <div className="col-6">
            <label className="form-label">Название</label>
            <RichTextEditor editorState={cellEditorsStates.cellNameEditorState.value} setEditorState={cellEditorsStates.cellNameEditorState.set} readOnly={!isAdmin} />
          </div>
          <div className="col-6">
            <label htmlFor="InputFirstName3" className="form-label">Единица измерения</label>
            <RichTextEditor editorState={cellEditorsStates.cellUnitEditorState.value} setEditorState={cellEditorsStates.cellUnitEditorState.set} readOnly={!isAdmin} />
          </div>
        </div>

        <div className="row">
          <div className="col">
            <label className="form-label">Условное обозначение</label>
            <RichTextEditor editorState={cellEditorsStates.cellSymbolEditorState.value} setEditorState={cellEditorsStates.cellSymbolEditorState.set} readOnly={!isAdmin} />
          </div>
        </div>

        <div className="col">
          <label htmlFor="InputFirstName3" className="form-label">Уровень GK</label>
          <select className="form-select" aria-label="Default select example" id='inputGK3' onChange={() => setGKoption(parseInt(document.getElementById("inputGK3").value))} disabled={!isAdmin}>
            {cellList}
          </select>
        </div>

        <div className="row">
          <div className="col">
            <label className="form-label">L</label>
            <input type="number" min="-10" max="10" step="1" className="form-control" id="inputL3" onChange={() => updatePreviewCell()} disabled={!isAdmin} />
          </div>
          <div className="col">
            <label className="form-label">T</label>
            <input type="number" min="-10" step="1" className="form-control" id="inputT3" onChange={() => updatePreviewCell()} disabled={!isAdmin} />
          </div>
        </div>
      </div>
      {isAdmin ?
        (<>
          <div className="modal-footer2">
            <Button type="button" className="btn btn-danger" onClick={(e) => deleteCell(e)}>Удалить</Button>
            <Button type="button" className="btn btn-success" onClick={(e) => saveButtonClick(e)}>Сохранить</Button>
          </div>
        </>) : (null)}
    </Modal>
  );
}
