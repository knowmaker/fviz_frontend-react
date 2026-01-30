import React, { useEffect, useState, useContext } from 'react';
import { getDataFromAPI, postDataToAPI, putDataToAPI, deleteDataFromAPI } from '../misc/api.js';
import { UserProfile, TableContext } from '../misc/contexts.js';
import { Cell } from '../components/Table.js';
import { isResponseSuccessful } from '../misc/api.js';
import { convertMarkdownFromEditorState } from '../pages/Home.js';
import { showMessage } from '../misc/message.js';
import { convertToMLTI, convertNumberToUnicodePower } from '../misc/converters.js';
import { convertMarkdownToEditorState } from '../misc/converters';
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
    isAdmin = userInfoState.userProfile.role;
  }

  const [currentModalLocaleFields, setCurrentModalLocaleFields] = useState(null);

  useEffect(() => {

    if (selectedCellState.selectedCell) {
      setCurrentModalLocaleFields({
        ...currentModalLocaleFields,
        id_gk: selectedCellState.selectedCell.id_gk,
        l_indicate: selectedCellState.selectedCell.l_indicate,
        t_indicate: selectedCellState.selectedCell.t_indicate,
        symbol: selectedCellState.selectedCell.symbol,
        ru: {
          value_name: selectedCellState.selectedCell.value_name,
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
      id_gk: parseInt(document.getElementById("inputGK3").value),
      l_indicate: parseInt(document.getElementById("inputL3").value),
      t_indicate: parseInt(document.getElementById("inputT3").value),
      symbol: convertMarkdownFromEditorState(cellEditorsStates.cellSymbolEditorState.value).split("/n").join(""),
      ru: {
        value_name: convertMarkdownFromEditorState(cellEditorsStates.cellNameEditorState.value).split("/n").join(""),
        unit: convertMarkdownFromEditorState(cellEditorsStates.cellUnitEditorState.value).split("/n").join(""),
      }
    }

    setCurrentModalLocaleFields(currentModalLocaleFieldsUpdated)

    if (selectedCell.id_value === -1) {
      const createdCellData = await createCell(currentModalLocaleFieldsUpdated);
      if (createdCellData) {
        tableState.setTableData(tableState.tableData.filter(cell => cell.id_lt !== createdCellData.id_lt).concat(createdCellData));
        modalVisibility.setVisibility(false);
      }
      return;
    }

    const updated = await updateCell(currentModalLocaleFieldsUpdated, selectedCell.id_value);
    if (updated) {
      showMessage("Ячейка была изменена");
    }
  };

  const updateCell = async (currentModalFields, cellId) => {
    const id_gk = currentModalFields.id_gk;
    const G_indicate = gkColors.find(gkLevel => gkLevel.id_gk === id_gk).g_indicate;
    const K_indicate = gkColors.find(gkLevel => gkLevel.id_gk === id_gk).k_indicate;
    const l_indicate = currentModalFields.l_indicate;
    const t_indicate = currentModalFields.t_indicate;
    const M_indicate = 0 - (G_indicate * -1 + K_indicate);
    const L_indicate = l_indicate - G_indicate * 3;
    const T_indicate = t_indicate - G_indicate * -2;
    const I_indicate = 0 - K_indicate * -1;

    const newCell = {
      quantity: {
        value_name: currentModalFields.ru.value_name,
        symbol: currentModalFields.symbol,
        unit: currentModalFields.ru.unit,
        l_indicate: l_indicate,
        t_indicate: t_indicate,
        id_gk: id_gk,
        m_indicate_auto: M_indicate,
        l_indicate_auto: L_indicate,
        t_indicate_auto: T_indicate,
        i_indicate_auto: I_indicate,
        mlti_sign: convertToMLTI(M_indicate, L_indicate, T_indicate, I_indicate)
      }
    };

    const changedCellResponseData = await putDataToAPI(`${API_BASE()}/quantities/${cellId}`, newCell, headers);
    if (!isResponseSuccessful(changedCellResponseData)) {
      showMessage(changedCellResponseData.data.error, "error");
      return false;
    }
    const cellData = changedCellResponseData.data.data;

    tableState.setTableData(tableState.tableData.filter(cell => cell.id_value !== cellData.id_value).concat(cellData));

    const cellAlternativesResponseData = await getDataFromAPI(`${API_BASE()}/layers/${selectedCell.id_lt}`, headers);
    if (isResponseSuccessful(cellAlternativesResponseData)) {
      const cellAlternatives = cellAlternativesResponseData.data.data;
      if (cellAlternatives.length > 0 && cellData.id_lt !== selectedCell.id_lt) {
        tableState.setTableData(tableState.tableData.filter(cell => cell.id_value !== cellData.id_value).concat(cellData).filter(cell => cell.id_lt !== selectedCell.id_lt).concat(cellAlternatives[0]));
      }
    }

    modalVisibility.setVisibility(false);
    return true;
  };

  const createCell = async (currentModalFields) => {
    const id_gk = currentModalFields.id_gk;
    const G_indicate = gkColors.find(gkLevel => gkLevel.id_gk === id_gk).g_indicate;
    const K_indicate = gkColors.find(gkLevel => gkLevel.id_gk === id_gk).k_indicate;
    const l_indicate = currentModalFields.l_indicate;
    const t_indicate = currentModalFields.t_indicate;
    const M_indicate = 0 - (G_indicate * -1 + K_indicate);
    const L_indicate = l_indicate - G_indicate * 3;
    const T_indicate = t_indicate - G_indicate * -2;
    const I_indicate = 0 - K_indicate * -1;

    const newCell = {
      quantity: {
        value_name: currentModalFields.ru.value_name,
        symbol: currentModalFields.symbol,
        unit: currentModalFields.ru.unit,
        l_indicate: l_indicate,
        t_indicate: t_indicate,
        id_gk: id_gk,
        m_indicate_auto: M_indicate,
        l_indicate_auto: L_indicate,
        t_indicate_auto: T_indicate,
        i_indicate_auto: I_indicate,
        mlti_sign: convertToMLTI(M_indicate, L_indicate, T_indicate, I_indicate)
      }
    };

    const createdCellResponseData = await postDataToAPI(`${API_BASE()}/quantities`, newCell, headers);
    if (!isResponseSuccessful(createdCellResponseData)) {
      showMessage(createdCellResponseData.data.error, "error");
      return null;
    }
    return createdCellResponseData.data.data;
  };

  const deleteCell = async () => {

    if (!selectedCell) {
      showMessage("Сначала выберите ячейку на поле", "error")
      return
    }

    if (!window.confirm("Вы уверены что хотите это сделать? Это приведёт к последствиям для других пользователей.")) {
      return;
    }

    const cellDeleteResponseData = await deleteDataFromAPI(`${API_BASE()}/quantities/${selectedCell.id_value}`, undefined, headers);
    if (!isResponseSuccessful(cellDeleteResponseData)) {
      showMessage(cellDeleteResponseData.data.error, "error");
      return;
    }

    tableState.setTableData(tableState.tableData.filter(cell => cell.id_value !== selectedCell.id_value));

    const cellAlternativesResponseData = await getDataFromAPI(`${API_BASE()}/layers/${selectedCell.id_lt}`, headers);
    if (isResponseSuccessful(cellAlternativesResponseData)) {
      const cellAlternatives = cellAlternativesResponseData.data.data;
      if (cellAlternatives.length > 0) {
        tableState.setTableData(tableState.tableData.filter(cell => cell.id_value !== selectedCell.id_value).concat(cellAlternatives[0]));
      }
    }

    showMessage("Ячейка удалена");
    modalVisibility.setVisibility(false);
  };

  const cellList = gkColors.map(gkLevel => {
    const shownText = `${gkLevel.gk_name} G${convertNumberToUnicodePower(gkLevel.g_indicate)}K<sup>${convertNumberToUnicodePower(gkLevel.k_indicate)}</sup>`;
    return (
      <option key={gkLevel.id_gk} value={gkLevel.id_gk} dangerouslySetInnerHTML={{ __html: shownText }} />
    );
  });

  const [previewCell, setPreviewCell] = useState({
    cellFullId: -1,
    cellData: { value_name: "не выбрано", symbol: "", unit: "" },
    cellColor: undefined
  });

  const [GKoption, setGKoption] = useState(null);

  useEffect(() => {
    updatePreviewCell();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellEditorsStates, GKoption, selectedCell]);

  const updatePreviewCell = () => {
    const id_gk = parseInt(document.getElementById("inputGK3").value);
    if (id_gk) {
      const cellColor = gkColors.find((setting) => setting.id_gk === id_gk).color;
      const G_indicate = gkColors.find(gkLevel => gkLevel.id_gk === id_gk).g_indicate;
      const K_indicate = gkColors.find(gkLevel => gkLevel.id_gk === id_gk).k_indicate;
      const l_indicate = parseInt(document.getElementById("inputL3").value);
      const t_indicate = parseInt(document.getElementById("inputT3").value);
      const M_indicate = 0 - (G_indicate * -1 + K_indicate);
      const L_indicate = l_indicate - G_indicate * 3;
      const T_indicate = t_indicate - G_indicate * -2;
      const I_indicate = 0 - K_indicate * -1;
      setPreviewCell({
        cellFullId: -1,
        cellData: {
          value_name: convertMarkdownFromEditorState(cellEditorsStates.cellNameEditorState.value),
          symbol: convertMarkdownFromEditorState(cellEditorsStates.cellSymbolEditorState.value),
          unit: convertMarkdownFromEditorState(cellEditorsStates.cellUnitEditorState.value),
          m_indicate_auto: M_indicate,
          l_indicate_auto: L_indicate,
          t_indicate_auto: T_indicate,
          i_indicate_auto: I_indicate,
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

        <div className="tab-content tab-content-border" id="nav-tabContent">
          <div className="tab-pane fade show active" id="cell-edit" role="tabpanel" tabIndex="0">
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
