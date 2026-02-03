import React, { useEffect, useState } from 'react';

import TableUI from '../components/Table';
import setStateFromGetAPI, { getDataFromAPI } from '../misc/api.js';
import { ToastContainer } from 'react-toastify';
import { UserProfile, TableContext, SystemTypeContext } from '../misc/contexts.js';
import { EditorState, convertToRaw } from 'draft-js';
import Footbar from '../components/FootBar';
import { useDownloadableScreenshot } from '../misc/Screenshot.js';
import draftToMarkdown from 'draftjs-to-markdown';
import { isResponseSuccessful } from '../misc/api';

import { EditCellModal } from '../modals/EditCellModal';
import { EditProfileModal } from '../modals/EditProfileModal';
import { EditLawsModal } from '../modals/LawsModal';
import { TableViewsModal } from '../modals/TableViewsModal';
import { LawsGroupsModal } from '../modals/LawsGroupsModal';
import { GKLayersModal } from '../modals/GKColorModal';
import { RegistrationModal } from '../modals/RegModal';
import { GKLayersImage } from '../modals/GKLayersImageModal';
import { convertMarkdownToEditorState } from '../misc/converters';
import { showMessage } from '../misc/message';

const API_BASE = () => process.env.REACT_APP_API_LINK;

export default function Home() {
  const [userToken, setUserToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const userInfoState = { userToken, setUserToken, userProfile, setUserProfile };

  const [isRegModalVisible, setRegModalVisibility] = useState(false);
  const regModalVisibility = { isVisible: isRegModalVisible, setVisibility: setRegModalVisibility };

  const [isEditProfileModalVisible, setEditProfileModalVisibility] = useState(false);
  const editProfileModalVisibility = { isVisible: isEditProfileModalVisible, setVisibility: setEditProfileModalVisibility };

  const [isEditCellModalVisible, setEditCellModalVisibility] = useState(false);
  const editCellModalVisibility = { isVisible: isEditCellModalVisible, setVisibility: setEditCellModalVisibility };

  const [isLawsModalVisible, setLawsModalVisibility] = useState(false);
  const lawsModalVisibility = { isVisible: isLawsModalVisible, setVisibility: setLawsModalVisibility };

  const [isTableViewsModalVisible, setTableViewsModalVisibility] = useState(false);
  const tableViewsModalVisibility = { isVisible: isTableViewsModalVisible, setVisibility: setTableViewsModalVisibility };

  const [isLawsGroupsModalVisible, setLawsGroupsModalVisibility] = useState(false);
  const lawsGroupsModalVisibility = { isVisible: isLawsGroupsModalVisible, setVisibility: setLawsGroupsModalVisibility };

  const [isGKColorsEditModalVisible, setGKColorsEditModalVisibility] = useState(false);
  const GKColorsEditModalVisibility = { isVisible: isGKColorsEditModalVisible, setVisibility: setGKColorsEditModalVisibility };

  const [isGKLayersImageModalVisible, setGKLayersImageModalVisibility] = useState(false);
  const GKLayersImageModalVisibility = { isVisible: isGKLayersImageModalVisible, setVisibility: setGKLayersImageModalVisibility };

  const [isLawsMenuVisible, setLawsMenuVisibility] = useState(false);
  const LawsMenuVisibility = { isVisible: isLawsMenuVisible, setVisibility: setLawsMenuVisibility };

  const modalsVisibility = {
    regModalVisibility,
    editProfileModalVisibility,
    editCellModalVisibility,
    lawsModalVisibility,
    tableViewsModalVisibility,
    lawsGroupsModalVisibility,
    GKColorsEditModalVisibility,
    LawsMenuVisibility,
  };

  const [tableData, setTableData] = useState([]);
  const tableState = { tableData, setTableData };
  const [GKLayers, setGKLayers] = useState([]);
  const GKLayersState = { gkColors: GKLayers, setGkColors: setGKLayers };

  const [tableView, setTableView] = useState({ id: 1, title: 'Базовое' });
  const tableViewState = { tableView, setTableView };

  const [tableViews, setTableViews] = useState(null);
  const [laws, setLaws] = useState(null);
  const lawsState = { laws, setLaws };

  const [selectedLaw, setSelectedLaw] = useState({ name: null, cells: [], law_group_id: null });
  const selectedLawState = { selectedLaw, setSelectedLaw };

  const [lawsGroups, setLawsGroups] = useState([]);
  const lawsGroupsState = { lawsGroups, setLawsGroups };

  const [systemTypes, setSystemTypes] = useState([]);
  const [currentSystemTypeId, setCurrentSystemTypeId] = useState(null);
  const systemTypeState = { systemTypes, setSystemTypes, currentSystemTypeId, setCurrentSystemTypeId };

  const getHeaders = () => {
    if (!userToken) {
      return undefined;
    }
    return {
      Authorization: `Bearer ${userToken}`,
    };
  };

  const setFullTableData = (result) => {
    setTableData(result?.quantities || []);

    const represent = result?.represent;
    if (!represent) {
      return;
    }

    setTableView({ id: represent.id, title: represent.title });
    if (represent.system_type_id !== undefined && represent.system_type_id !== null) {
      setCurrentSystemTypeId(represent.system_type_id);
    }
  };

  const loadRepresentView = async (headers, representId = null) => {
    const address = representId ? `${API_BASE()}/represents/${representId}/view` : `${API_BASE()}/represents/view`;

    const tableViewResponseData = await getDataFromAPI(address, headers);
    if (!isResponseSuccessful(tableViewResponseData)) {
      return false;
    }

    const responseData = tableViewResponseData.data;
    if (responseData?.represent) {
      setFullTableData(responseData);
      return true;
    }

    if (responseData?.id !== undefined) {
      setTableData(responseData.quantities || []);
      setTableView({ id: responseData.id, title: responseData.title });
      return true;
    }

    return false;
  };

  const loadSystemTypeScopedData = async (systemTypeId) => {
    if (!systemTypeId) {
      return;
    }

    const headers = getHeaders();

    const [gkResponse, tableViewsResponse, lawsResponse, lawsGroupsResponse] = await Promise.all([
      getDataFromAPI(`${API_BASE()}/gk/by-system-type/${systemTypeId}`, headers),
      getDataFromAPI(`${API_BASE()}/represents/by-system-type/${systemTypeId}`, headers),
      getDataFromAPI(`${API_BASE()}/laws/by-system-type/${systemTypeId}`, headers),
      getDataFromAPI(`${API_BASE()}/law_groups/by-system-type/${systemTypeId}`, headers),
    ]);

    if (isResponseSuccessful(gkResponse)) {
      setGKLayers(gkResponse.data);
    }
    if (isResponseSuccessful(lawsResponse)) {
      setLaws(lawsResponse.data);
    }
    if (isResponseSuccessful(lawsGroupsResponse)) {
      setLawsGroups(lawsGroupsResponse.data);
    }

    if (!isResponseSuccessful(tableViewsResponse)) {
      return;
    }

    const nextTableViews = tableViewsResponse.data || [];
    setTableViews(nextTableViews);

    if (nextTableViews.length === 0) {
      setTableData([]);
      setTableView({ id: null, title: '' });
      return;
    }

    const activeRepresent = nextTableViews.find((view) => view.is_active) || nextTableViews[0];
    await loadRepresentView(headers, activeRepresent.id);
  };

  useEffect(() => {
    if (userToken) {
      const headers = getHeaders();
      localStorage.setItem('token', userToken);
      setStateFromGetAPI(setUserProfile, `${API_BASE()}/users/me`, undefined, headers);
      setStateFromGetAPI(setSystemTypes, `${API_BASE()}/system_types`, undefined, headers);
      loadRepresentView(headers);
    } else {
      setUserProfile(null);
      const storageToken = localStorage.getItem('token');
      if (!storageToken) {
        setStateFromGetAPI(setSystemTypes, `${API_BASE()}/system_types`, undefined, undefined);
        loadRepresentView(undefined);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken]);

  useEffect(() => {
    loadSystemTypeScopedData(currentSystemTypeId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSystemTypeId, userToken]);

  useEffect(() => {
    if (userProfile) {
      document.getElementById('InputEmail3').value = userProfile.email;
      document.getElementById('InputFirstName3').value = userProfile.first_name;
      document.getElementById('InputLastName3').value = userProfile.last_name;
      document.getElementById('InputPatronymic3').value = userProfile.patronymic;
    } else {
      document.getElementById('InputEmail3').value = '';
      document.getElementById('InputFirstName3').value = '';
      document.getElementById('InputLastName3').value = '';
      document.getElementById('InputPatronymic3').value = '';
    }
  }, [userProfile]);

  useEffect(() => {
    async function logInByLocalStorage() {
      const storageToken = localStorage.getItem('token');
      if (storageToken) {
        const headers = {
          Authorization: `Bearer ${storageToken}`,
        };

        const profileResponseData = await getDataFromAPI(`${API_BASE()}/users/me`, headers);
        if (!isResponseSuccessful(profileResponseData)) {
          localStorage.removeItem('token');
          return;
        }
        showMessage('Авторизация успешна');

        setUserToken(storageToken);
      }
    }
    logInByLocalStorage();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedCell, setSelectedCell] = useState(null);
  const selectedCellState = { selectedCell, setSelectedCell };

  const [hoveredCell, setHoveredCell] = useState(null);
  const hoveredCellState = { hoveredCell, setHoveredCell };

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const revStates = { undoStack, setUndoStack, redoStack, setRedoStack };

  const [cellNameEditor, setCellNameEditor] = useState(EditorState.createEmpty());
  const cellNameEditorState = { value: cellNameEditor, set: setCellNameEditor };
  const [cellSymbolEditor, setCellSymbolEditor] = useState(EditorState.createEmpty());
  const cellSymbolEditorState = { value: cellSymbolEditor, set: setCellSymbolEditor };
  const [cellUnitEditor, setCellUnitEditor] = useState(EditorState.createEmpty());
  const cellUnitEditorState = { value: cellUnitEditor, set: setCellUnitEditor };
  const [cellMLTIEditor, setCellMLTIEditor] = useState(EditorState.createEmpty());
  const cellMLTIEditorState = { value: cellMLTIEditor, set: setCellMLTIEditor };

  const [cellLEditor, setCellLEditor] = useState(0);
  const cellLEditorState = { value: cellLEditor, set: setCellLEditor };
  const [cellTEditor, setCellTEditor] = useState(0);
  const cellTEditorState = { value: cellTEditor, set: setCellTEditor };
  const cellEditorsStates = { cellNameEditorState, cellSymbolEditorState, cellUnitEditorState, cellLEditorState, cellTEditorState, cellMLTIEditorState };

  const [lawNameEditor, setLawNameEditor] = useState(EditorState.createEmpty());
  const lawNameEditorState = { value: lawNameEditor, set: setLawNameEditor };
  const [lawGroupEditor, setLawGroupEditor] = useState(0);
  const lawGroupEditorState = { value: lawGroupEditor, set: setLawGroupEditor };

  const lawEditorsStates = { lawNameEditorState, lawGroupEditorState };

  const [showMode, setShowMode] = useState(false);
  const showModeState = { showMode, setShowMode };

  useEffect(() => {
    const keyDownHandler = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedLaw({ name: null, cells: [], law_group_id: null });
        modalsVisibility.lawsModalVisibility.setVisibility(false);
      }
    };
    document.addEventListener('keydown', keyDownHandler);

    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function setSelectedCellFromState() {
      if (selectedCell) {
        if (selectedCell.id === -1) {
          convertMarkdownToEditorState(setCellNameEditor, selectedCell.name ? selectedCell.name : '');
          convertMarkdownToEditorState(setCellSymbolEditor, selectedCell.symbol ? selectedCell.symbol : '');
          convertMarkdownToEditorState(setCellUnitEditor, selectedCell.unit ? selectedCell.unit : '');
          document.getElementById('inputL3').value = selectedCell.l_indicate;
          document.getElementById('inputT3').value = selectedCell.t_indicate;
          document.getElementById('inputGK3').value = selectedCell.gk_id;

          return;
        }

        let cellData;
        if (selectedCell.g_indicate === undefined && selectedCell.id !== 1) {
          const cellResponseData = await getDataFromAPI(`${API_BASE()}/quantities/${selectedCell.id}`);
          if (!isResponseSuccessful(cellResponseData)) {
            showMessage(cellResponseData.data?.detail || cellResponseData.data?.error, 'error');
            return;
          }
          cellData = cellResponseData.data;
        } else {
          cellData = selectedCell;
        }

        convertMarkdownToEditorState(setCellNameEditor, cellData.name);
        convertMarkdownToEditorState(setCellSymbolEditor, cellData.symbol);
        convertMarkdownToEditorState(setCellUnitEditor, cellData.unit);
        document.getElementById('inputL3').value = cellData.l_indicate;
        document.getElementById('inputT3').value = cellData.t_indicate;
        document.getElementById('inputGK3').value = cellData.gk_id;
      } else {
        convertMarkdownToEditorState(setCellNameEditor, '');
        convertMarkdownToEditorState(setCellSymbolEditor, '');
        convertMarkdownToEditorState(setCellUnitEditor, '');
        document.getElementById('inputL3').value = null;
        document.getElementById('inputT3').value = null;
        document.getElementById('inputGK3').value = null;
      }
    }
    setSelectedCellFromState();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCell]);

  const selectSystemType = (systemTypeId) => {
    if (!systemTypeId || currentSystemTypeId === systemTypeId) {
      return;
    }

    setSelectedLaw({ name: null, cells: [], law_group_id: null });
    setSelectedCell(null);
    setCurrentSystemTypeId(systemTypeId);
  };

  const { ref, getImage } = useDownloadableScreenshot();

  return (
    <>
      <UserProfile.Provider value={userInfoState}>
        <TableContext.Provider value={tableState}>
          <SystemTypeContext.Provider value={systemTypeState}>
            <div className="system-types-panel">
              <div className="system-types-title">Тип системы</div>
              {(systemTypes || []).map((systemType) => {
                const isActive = systemType.id === currentSystemTypeId;

                return (
                  <button
                    key={systemType.id}
                    type="button"
                    className={`btn btn-sm system-type-button ${isActive ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => selectSystemType(systemType.id)}
                  >
                    {systemType.name || systemType.title || `#${systemType.id}`}
                  </button>
                );
              })}
            </div>

            <TableUI modalsVisibility={modalsVisibility} selectedCellState={selectedCellState} revStates={revStates} gkState={GKLayersState} selectedLawState={selectedLawState} hoveredCellState={hoveredCellState} refTable={ref} lawsGroupsState={lawsGroupsState} lawsState={lawsState} lawEditorsStates={lawEditorsStates} showModeState={showModeState} />
            <GKLayersImage modalVisibility={GKLayersImageModalVisibility} />
            <Footbar GKLayersImageModalVisibility={GKLayersImageModalVisibility} hoveredCell={hoveredCell} selectedLawState={selectedLawState} getImage={getImage} tableViewState={tableViewState} setTableViews={setTableViews} modalsVisibility={modalsVisibility} showModeState={showModeState} selectedCellState={selectedCellState} />

            <div id="modal-mask" className="hidden"></div>
            <RegistrationModal modalVisibility={modalsVisibility.regModalVisibility} setUserToken={setUserToken} />
            <EditCellModal modalVisibility={modalsVisibility.editCellModalVisibility} selectedCell={selectedCell} selectedCellState={selectedCellState} cellEditorsStates={cellEditorsStates} gkColors={GKLayers} />
            <EditProfileModal modalsVisibility={modalsVisibility} userInfoState={userInfoState} />
            <EditLawsModal modalsVisibility={modalsVisibility} lawsState={lawsState} selectedLawState={selectedLawState} lawsGroupsState={lawsGroupsState} lawEditorsStates={lawEditorsStates} />
            <TableViewsModal modalsVisibility={modalsVisibility} tableViews={tableViews} setTableViews={setTableViews} tableViewState={tableViewState} revStates={revStates} selectedLawState={selectedLawState} />
            <LawsGroupsModal modalsVisibility={modalsVisibility} lawsGroupsState={lawsGroupsState} lawsState={lawsState} />
            <GKLayersModal modalsVisibility={modalsVisibility} GKLayersState={GKLayersState} />

            <ToastContainer />
          </SystemTypeContext.Provider>
        </TableContext.Provider>
      </UserProfile.Provider>
    </>
  );
}

export function convertMarkdownFromEditorState(state) {
  const html = draftToMarkdown(convertToRaw(state.getCurrentContent())).replace('\n', '');
  return html;
}

export function showPassword(inputElementRef, eyeElementRef) {
  if (inputElementRef.current.getAttribute('type') === 'text') {
    inputElementRef.current.setAttribute('type', 'password');
    eyeElementRef.current.classList.add('fa-eye-slash');
    eyeElementRef.current.classList.remove('fa-eye');
  } else if (inputElementRef.current.getAttribute('type') === 'password') {
    inputElementRef.current.setAttribute('type', 'text');
    eyeElementRef.current.classList.remove('fa-eye-slash');
    eyeElementRef.current.classList.add('fa-eye');
  }
}

