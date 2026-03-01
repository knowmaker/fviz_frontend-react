import React, { useContext } from 'react';
import { UserProfile, TableContext, SystemTypeContext } from '../misc/contexts.js';
import { showMessage } from '../misc/message.js';
import setStateFromGetAPI, { patchDataToAPI, isResponseSuccessful } from '../misc/api.js';
import { Button } from '../components/ButtonWithLoad.js';
import { formatIndicateForSup } from '../misc/converters.js';
import { IconCamera, IconLayersSubtract } from '@tabler/icons-react';

const API_BASE = () => process.env.REACT_APP_API_LINK;

export default function Footbar({ hoveredCell, selectedLawState, getImage, tableViewState, setTableViews, modalsVisibility, showModeState, selectedCellState, GKLayersImageModalVisibility }) {
  const userInfoState = useContext(UserProfile);
  const tableState = useContext(TableContext);
  const systemTypeState = useContext(SystemTypeContext);

  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`,
  };
  let isAuthorized = false;
  if (userInfoState.userProfile) {
    isAuthorized = true;
  }

  let cellLT = "-"
  let cellGK = "-"
  if (hoveredCell) {

    cellLT = hoveredCell.l_indicate !== undefined ? `L<sup>${hoveredCell.l_indicate}</sup>T<sup>${hoveredCell.t_indicate}</sup>` : "-"
    cellGK = hoveredCell.GKLayer ? `G<sup>${formatIndicateForSup(hoveredCell.GKLayer.g_indicate)}</sup>K<sup>${formatIndicateForSup(hoveredCell.GKLayer.k_indicate)}</sup>` : "-"
  }

  const tableViewTitle = tableViewState.tableView?.title || "-";
  const maxTitleLength = 44;
  const shortTableViewTitle = tableViewTitle.length > maxTitleLength
    ? `${tableViewTitle.slice(0, maxTitleLength - 1)}…`
    : tableViewTitle;
  const centeredTitle = `Текущее представление: ${shortTableViewTitle}`;
  const centeredTitleFull = `Текущее представление: ${tableViewTitle}`;

  const removeCurrentLaw = () => {
    selectedLawState.setSelectedLaw({ name: null, cells: [], law_group_id: null });
  };

  const downloadScreenshot = async (e) => {
    await getImage(e);
  };

  const updateTableView = async () => {
    const cellIds = Object.values(tableState)[0].map(cell => cell.id).filter(id => id !== -1);

    const payload = {
      title: tableViewState.tableView.title,
      quantity_ids: cellIds,
    };

    const changedTableViewResponseData = await patchDataToAPI(`${API_BASE()}/represents/${tableViewState.tableView.id}`, payload, headers);
    if (!isResponseSuccessful(changedTableViewResponseData)) {
      showMessage(changedTableViewResponseData.data?.detail || changedTableViewResponseData.data?.error, "error");
      return
    }

    setStateFromGetAPI(setTableViews, `${API_BASE()}/represents/by-system-type/${systemTypeState.currentSystemTypeId}`, undefined, headers);

    showMessage("Представление обновлено");

  }

  const showGKLayersImageModal = () => {
    GKLayersImageModalVisibility.setVisibility(true)
  }

  const setShowModeState = (event) => {
    showModeState.setShowMode(event.target.checked)
  }

  const renderModeSwitch = (switchId, extraClass = "") => (
    <div className={`footbar-mode-group ${extraClass}`.trim()}>
      <span className="footbar-mode-text">Режим законов</span>
      <div className="form-check form-switch m-0">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id={switchId}
          onChange={setShowModeState}
          checked={showModeState.showMode}
        />
      </div>
      <span className="footbar-mode-text">Режим величин</span>
    </div>
  );

  return (
    <>
      <div className="gk-levels-floating">
        <div className="btn-sm btn-primary btn gk-layers-button" aria-current="page" onClick={showGKLayersImageModal} title="Уровни GK" aria-label="Уровни GK">
          <IconLayersSubtract size={44} stroke={1.8} aria-hidden="true" className="gk-layers-button-icon" />
          <span className="gk-layers-button-text">GK</span>
        </div>
      </div>
      <div className="screenshot-floating">
        <div className="btn-sm btn-primary btn gk-layers-button" aria-current="page" onClick={(e) => downloadScreenshot(e)} title="Скачать скриншот" aria-label="Скачать скриншот">
          <IconCamera size={44} stroke={1.8} aria-hidden="true" className="gk-layers-button-icon" />
          <span className="gk-layers-button-text">ФОТО</span>
        </div>
      </div>
      <nav className="navbar navbar-expand-lg fixed-bottom bg-body-tertiary">
      <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#footerSupportedContent" aria-controls="footerSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        {renderModeSwitch("flexSwitchCheckMobile", "footbar-mobile-mode")}
        <div className="collapse navbar-collapse" id="footerSupportedContent">
          <div className="footbar-content">
            <div className="footbar-left-group">
              <div className="diminput footbar-input footbar-html-input" id="outLT" aria-disabled="true">
                <div className="v-align" dangerouslySetInnerHTML={{ __html: cellLT }} />
              </div>
              <div className="diminput footbar-input footbar-html-input" id="outGK" aria-disabled="true">
                <div className="v-align" dangerouslySetInnerHTML={{ __html: cellGK }} />
              </div>
              {renderModeSwitch("flexSwitchCheckDesktop", "footbar-desktop-mode")}
            </div>
            <div className="footbar-center-title" title={centeredTitleFull}>{centeredTitle}</div>
            <div className="footbar-right-group">
              {isAuthorized && tableViewState.tableView.id !== 0 ? (
                <Button className="btn-sm btn-primary btn footbar-button footbar-save-button" aria-current="page" onClick={(e) => updateTableView(e)}>Сохранить представление</Button>
              ) : null}
              <div className="footbar-delete-slot">
                {selectedLawState.selectedLaw.cells.length >= 1 ? (
                  <div className="btn-sm btn-primary btn footbar-button footbar-delete-button" aria-current="page" onClick={removeCurrentLaw}>Стереть закон</div>
                ) : (
                  <div className="footbar-delete-placeholder" aria-hidden="true"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}


