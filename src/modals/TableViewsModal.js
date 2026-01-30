import React, { useEffect, useState, useContext } from 'react';
import setStateFromGetAPI, { getDataFromAPI, postDataToAPI, putDataToAPI, deleteDataFromAPI } from '../misc/api.js';
import { UserProfile, TableContext } from '../misc/contexts.js';
import { EditorState } from 'draft-js';
import { isResponseSuccessful } from '../misc/api.js';
import { RichTextEditor } from '../components/RichTextEditor.js';
import { convertMarkdownFromEditorState } from '../pages/Home.js';
import { showMessage } from '../misc/message.js';
import { convertMarkdownToEditorState } from '../misc/converters.js';
import { Modal } from './Modal.js';
import { Button } from '../components/ButtonWithLoad.js';

const API_BASE = () => process.env.REACT_APP_API_LINK;

export function TableViewsModal({ modalsVisibility, tableViews, setTableViews, tableViewState, revStates, selectedLawState }) {

  const userInfoState = useContext(UserProfile);
  const tableState = useContext(TableContext);
  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`
  };

  const [tableViewEditorState, setTableViewEditorState] = useState(EditorState.createEmpty());

  useEffect(() => {
    if (modalsVisibility.tableViewsModalVisibility.isVisible === false) {
      convertMarkdownToEditorState(setTableViewEditorState, "");
    } else {
      convertMarkdownToEditorState(setTableViewEditorState, tableViewState.tableView.title)
    }
  }, [modalsVisibility.tableViewsModalVisibility.isVisible, tableViewState.tableView.title]);


  const selectTableView = async (tableView) => {

    revStates.setUndoStack([])
    revStates.setRedoStack([])

    selectedLawState.setSelectedLaw({ law_name: null, cells: [], id_type: null })

    const tableViewDataResponse = await getDataFromAPI(`${API_BASE()}/active_view/${tableView.id_repr}`, headers);
    if (!isResponseSuccessful(tableViewDataResponse)) {
      showMessage(tableViewDataResponse.data.error, "error");
      return;
    }
    const tableViewData = tableViewDataResponse.data.data;

    tableViewState.setTableView({ id_repr: tableView.id_repr, title: tableViewData.title });
    tableState.setTableData(tableViewData.active_quantities);

    convertMarkdownToEditorState(setTableViewEditorState, tableViewData.title);

  };

  const updateTableView = async () => {

    const cellIds = Object.values(tableState)[0].map(cell => cell.id_value).filter(id => id !== -1);

    const tableViewTitle = convertMarkdownFromEditorState(tableViewEditorState);

    const newTableView = {
      title: tableViewTitle,
      active_quantities: cellIds,
    };

    const changedTableViewResponseData = await putDataToAPI(`${API_BASE()}/represents/${tableViewState.tableView.id_repr}`, newTableView, headers);
    if (!isResponseSuccessful(changedTableViewResponseData)) {
      showMessage(changedTableViewResponseData.data.error, "error");
      return;
    }

    setStateFromGetAPI(setTableViews, `${API_BASE()}/represents`, undefined, headers);

    showMessage("Представление обновлено");

  };

  const deleteTableView = async (tableView) => {

    if (!window.confirm("Вы уверены что хотите это сделать?")) {
      return;
    }

    const tableViewDeleteResponseData = await deleteDataFromAPI(`${API_BASE()}/represents/${tableView.id_repr}`, undefined, headers);
    if (!isResponseSuccessful(tableViewDeleteResponseData)) {
      showMessage(tableViewDeleteResponseData.data.error, "error");
      return;
    }

    setStateFromGetAPI(setTableViews, `${API_BASE()}/represents`, undefined, headers);

    showMessage("Представление удалено");

  };

  const createTableView = async () => {

    const cellIds = Object.values(tableState)[0].map(cell => cell.id_value).filter(id => id !== -1);

    const tableViewTitle = convertMarkdownFromEditorState(tableViewEditorState);

    const newTableView = {
      title: tableViewTitle,
      active_quantities: cellIds,
    };
    const newTableViewResponseData = await postDataToAPI(`${API_BASE()}/represents`, newTableView, headers);
    if (!isResponseSuccessful(newTableViewResponseData)) {
      showMessage(newTableViewResponseData.data.error, "error");
      return;
    }

    setStateFromGetAPI(setTableViews, `${API_BASE()}/represents`, undefined, headers);

    showMessage("Представление создано");

  };


  let tableViewsMarkup = null;
  if (tableViews) {
    tableViewsMarkup = tableViews.map(tableView => {

      const isCurrent = tableView.id_repr === tableViewState.tableView.id_repr;

      return (
        <tr key={tableView.id_repr}>
          <th scope="row" className='small-cell'>{isCurrent ? `+` : ''}</th>
          <td dangerouslySetInnerHTML={{ __html: tableView.title }}></td>
          <td className='small-cell'><button type="button" className="btn btn-primary btn-sm" onClick={() => selectTableView(tableView)}>📝</button></td>
          <td className='small-cell'><button type="button" className="btn btn-danger btn-sm" onClick={() => deleteTableView(tableView)}>🗑</button></td>
        </tr>
      );
    });
  }



  return (
    <Modal
      modalVisibility={modalsVisibility.tableViewsModalVisibility}
      title="Представления ФВ"
      hasBackground={false}
      sizeX={600}
    >
      <div className="modal-content2">

        <div className="row">
          <div className="col-2">
            Название:
          </div>
          <div className="col-5">
            <RichTextEditor editorState={tableViewEditorState} setEditorState={setTableViewEditorState} />
          </div>
          <div className="col-2">
            <Button type="button" className="btn btn-success" onClick={(e) => createTableView(e)}>Создать</Button>
          </div>
          <div className="col-3">
            <Button type="button" className="btn btn-info" onClick={(e) => updateTableView(e)}>Обновить</Button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Название</th>
              <th scope="col">Выбрать</th>
              <th scope="col">Удалить</th>
            </tr>
          </thead>
          <tbody>
            {tableViewsMarkup}
          </tbody>
        </table>
      </div>

    </Modal>
  );
}
