import React,{useContext} from 'react';
import { UserProfile,TableContext } from '../misc/contexts.js';
import { showMessage } from '../misc/message.js';
import setStateFromGetAPI, { patchDataToAPI, isResponseSuccessful } from '../misc/api.js';
import { SELECTED_SYSTEM_TYPE_ID } from '../misc/constants';
import { Button } from '../components/ButtonWithLoad.js';

const API_BASE = () => process.env.REACT_APP_API_LINK;

export default function Footbar({hoveredCell,selectedLawState,getImage,tableViewState,setTableViews,modalsVisibility,showModeState,selectedCellState,GKLayersImageModalVisibility}) {

  const userInfoState = useContext(UserProfile)
  const tableState = useContext(TableContext)
  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`
  }
  let isAdmin = false
  if (userInfoState.userProfile) {
    isAdmin = userInfoState.userProfile.role
  }
  let isAuthorized = false;
  if (userInfoState.userProfile) {
      isAuthorized = true;
  }

  let cellLT = "-"
  let cellGK = "-"
  if (hoveredCell) {

    cellLT = hoveredCell.l_indicate !== undefined ? `L<sup>${hoveredCell.l_indicate}</sup>T<sup>${hoveredCell.t_indicate}</sup>` : "-"
    cellGK = hoveredCell.GKLayer ? `G<sup>${hoveredCell.GKLayer.g_indicate}</sup>K<sup>${hoveredCell.GKLayer.k_indicate}</sup>` : "-"
  }

  const removeCurrentLaw = () => {
    selectedLawState.setSelectedLaw({ name: null, cells: [], law_group_id: null });
  }

  const downloadPDF = async () => {

      const headers = {
        Authorization: `Bearer ${userInfoState.userToken}`,
      };

      const response = await fetch(`${API_BASE()}/quantities`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        showMessage(response.data?.error,"error")
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = "Величины.pdf";
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
  };

  const downloadScreenshot = async (e) => {
    await getImage(e)
  }



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

     setStateFromGetAPI(setTableViews, `${API_BASE()}/represents/by-system-type/${SELECTED_SYSTEM_TYPE_ID}`, undefined, headers);

     showMessage("Представление обновлено");

  }

  const showGKLayersImageModal = () => {
    GKLayersImageModalVisibility.setVisibility(true)
  }

  const setShowModeState = () => {
    const isSwitchActive = document.getElementById("flexSwitchCheck").checked
    showModeState.setShowMode(isSwitchActive)
  }

  return (
  <nav className="navbar navbar-expand-lg fixed-bottom bg-body-tertiary">
    <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#footerSupportedContent" aria-controls="footerSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="footerSupportedContent">
            <div className="navbar-nav">
              <div className="diminput footbar-input" id="outLT">
                <div className="v-align" dangerouslySetInnerHTML={{__html: cellLT}}/>
              </div>
              <div className="diminput footbar-input" id="outGK">
                <div className="v-align" dangerouslySetInnerHTML={{__html: cellGK}}/>
              </div>
              {isAuthorized ?
              (<>
              <div className="nameinput footbar-input" id="outName">
                <div className="v-align " dangerouslySetInnerHTML={{__html: tableViewState.tableView.title}}></div>
              </div>
              <Button className="btn-sm btn-primary btn footbar-button" aria-current="page" onClick={(e) => updateTableView(e)}>Сохранить представление</Button>
              </>) : (null)}
              <div className="btn-sm btn-primary btn footbar-button" aria-current="page" onClick={showGKLayersImageModal}>Показать уровни GK</div>
              <Button className="btn-sm btn-primary btn footbar-button" aria-current="page" onClick={(e) => downloadScreenshot(e)}>Скачать скриншот</Button>
                {isAdmin ?
                    (<>
                        <Button className="btn-sm btn-primary btn footbar-button" aria-current="page" onClick={(e) => downloadPDF(e)}>Скачать pdf</Button>
                    </>) : (null)}

                  <label className="form-check-label">Режим законов</label>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="flexSwitchCheck" onClick={(e) => {setShowModeState(e)}}/>
                  <label className="form-check-label" htmlFor="flexSwitchCheck">Режим просмотра</label>
                </div>
            </div>
        </div>
        {selectedLawState.selectedLaw.cells.length >= 1 ?
              (<>
        <div className="navbar-text">
            <div className="btn-sm btn-primary btn footbar-button" aria-current="page" onClick={removeCurrentLaw}>Стереть закон</div>
        </div>
        </>) : (null)}

    </div>
  </nav>
    );
}
