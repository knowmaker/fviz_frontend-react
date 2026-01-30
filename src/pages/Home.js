import React,{useEffect,useState} from 'react';

import TableUI from '../components/Table';
import setStateFromGetAPI, {
  getDataFromAPI} from '../misc/api.js';
import { ToastContainer } from 'react-toastify';
import { UserProfile,TableContext } from '../misc/contexts.js';
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

  const [userToken, setUserToken] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  const userInfoState = {userToken, setUserToken,userProfile, setUserProfile}

  useEffect(() => {

    if (userToken) {

      const headers = {
        Authorization: `Bearer ${userToken}`
      }

      setStateFromGetAPI(setUserProfile, `${API_BASE()}/users/profile`, undefined, headers )
      setStateFromGetAPI(setGKLayers,`${API_BASE()}/gk`,undefined,headers)
      setStateFromGetAPI(setTableViews, `${API_BASE()}/represents`,undefined,headers)
      setStateFromGetAPI(setLaws, `${API_BASE()}/laws`,undefined,headers)
      setStateFromGetAPI(setLawsGroups, `${API_BASE()}/law_types`,undefined,headers)

      setStateFromGetAPI(setFullTableData,`${API_BASE()}/active_view`,undefined,headers)

      localStorage.setItem('token', userToken);

    } else {
      setUserProfile(null)
      const storageToken = localStorage.getItem('token');
      if (!storageToken) {
        setStateFromGetAPI(setFullTableData,`${API_BASE()}/active_view`,undefined,undefined)
        console.log()
      }
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken]);


  useEffect(() => {

    if (userProfile) {
      document.getElementById("InputEmail3").value = userProfile.email
      document.getElementById("InputFirstName3").value = userProfile.first_name
      document.getElementById("InputLastName3").value = userProfile.last_name
      document.getElementById("InputPatronymic3").value = userProfile.patronymic
    } else {
      document.getElementById("InputEmail3").value = ""
      document.getElementById("InputFirstName3").value = ""
      document.getElementById("InputLastName3").value = ""
      document.getElementById("InputPatronymic3").value = ""
    }
  }, [userProfile]);



    const [isRegModalVisible, setRegModalVisibility] = useState(false);
    const regModalVisibility = {isVisible: isRegModalVisible, setVisibility: setRegModalVisibility}

    const [isEditProfileModalVisible, setEditProfileModalVisibility] = useState(false);
    const editProfileModalVisibility = {isVisible: isEditProfileModalVisible, setVisibility: setEditProfileModalVisibility}

    const [isEditCellModalVisible, setEditCellModalVisibility] = useState(false);
    const editCellModalVisibility = {isVisible: isEditCellModalVisible, setVisibility: setEditCellModalVisibility}

    const [isLawsModalVisible, setLawsModalVisibility] = useState(false);
    const lawsModalVisibility = {isVisible: isLawsModalVisible, setVisibility: setLawsModalVisibility}

    const [isTableViewsModalVisible, setTableViewsModalVisibility] = useState(false);
    const tableViewsModalVisibility = {isVisible: isTableViewsModalVisible, setVisibility: setTableViewsModalVisibility}

    const [isLawsGroupsModalVisible, setLawsGroupsModalVisibility] = useState(false);
    const lawsGroupsModalVisibility = {isVisible: isLawsGroupsModalVisible, setVisibility: setLawsGroupsModalVisibility}

    const [isGKColorsEditModalVisible, setGKColorsEditModalVisibility] = useState(false);
    const GKColorsEditModalVisibility = {isVisible: isGKColorsEditModalVisible, setVisibility: setGKColorsEditModalVisibility}

    const [isGKLayersImageModalVisible, setGKLayersImageModalVisibility] = useState(false);
    const GKLayersImageModalVisibility = {isVisible: isGKLayersImageModalVisible, setVisibility: setGKLayersImageModalVisibility}

    const [isLawsMenuVisible, setLawsMenuVisibility] = useState(false);
    const LawsMenuVisibility = {isVisible: isLawsMenuVisible, setVisibility: setLawsMenuVisibility}


    const modalsVisibility={regModalVisibility,editProfileModalVisibility,
                            editCellModalVisibility,lawsModalVisibility,
                            tableViewsModalVisibility,lawsGroupsModalVisibility
                            ,GKColorsEditModalVisibility,
                            LawsMenuVisibility}


    const [tableData, setTableData] = useState([]);
    const tableState = {tableData,setTableData}
    const [GKLayers, setGKLayers] = useState([]);
    const GKLayersState = {gkColors: GKLayers, setGkColors: setGKLayers}

    const [tableView, setTableView] = useState({id_repr:1,title:"Базовое"});
    const tableViewState = {tableView,setTableView}

    useEffect(() => {

      setStateFromGetAPI(setGKLayers,`${API_BASE()}/gk`,undefined,undefined)

      if (userToken) {

        const headers = {
          Authorization: `Bearer ${userToken}`
        }

        setStateFromGetAPI(setTableViews, `${API_BASE()}/represents`,undefined,headers)
        setStateFromGetAPI(setLaws, `${API_BASE()}/laws`,undefined,headers)
        setStateFromGetAPI(setLawsGroups, `${API_BASE()}/law_types`,undefined,headers)
        setStateFromGetAPI(setFullTableData,`${API_BASE()}/active_view/${tableView.id_repr}`,undefined,headers)


      } else {
        const storageToken = localStorage.getItem('token');
        if (!storageToken) {
          setStateFromGetAPI(setFullTableData,`${API_BASE()}/active_view`,undefined,undefined)
        }
      }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const setFullTableData = (result) => {

      setTableData(result.active_quantities)
      setTableView({id_repr:result.id_repr,title:result.title})
    }

    useEffect(() => {

      setStateFromGetAPI(setGKLayers,`${API_BASE()}/gk`)

      async function logInByLocalStorage() {

        const storageToken = localStorage.getItem('token');
        if (storageToken) {
          const headers = {
            Authorization: `Bearer ${storageToken}`
          }

          const profileResponseData = await getDataFromAPI(`${API_BASE()}/users/profile`,headers)
          if (!isResponseSuccessful(profileResponseData)) {
            localStorage.removeItem('token')
            return
          }
          showMessage("Авторизация успешна")

          setUserToken(storageToken)


        }


      }
      logInByLocalStorage()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);



    const [selectedCell, setSelectedCell] = useState(null);
    const selectedCellState={selectedCell, setSelectedCell}


    const [hoveredCell, setHoveredCell] = useState(null);
    const hoveredCellState = {hoveredCell, setHoveredCell}

    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const revStates = {undoStack,setUndoStack,redoStack,setRedoStack}




    const [cellNameEditor, setCellNameEditor] = useState(EditorState.createEmpty());
    const cellNameEditorState = {value: cellNameEditor, set: setCellNameEditor}
    const [cellSymbolEditor, setCellSymbolEditor] = useState(EditorState.createEmpty());
    const cellSymbolEditorState = {value: cellSymbolEditor, set: setCellSymbolEditor}
    const [cellUnitEditor, setCellUnitEditor] = useState(EditorState.createEmpty());
    const cellUnitEditorState = {value: cellUnitEditor, set: setCellUnitEditor}
    const [cellMLTIEditor, setCellMLTIEditor] = useState(EditorState.createEmpty());
    const cellMLTIEditorState = {value: cellMLTIEditor, set: setCellMLTIEditor}

    const [cellLEditor, setCellLEditor] = useState(0)
    const cellLEditorState = {value: cellLEditor, set: setCellLEditor}
    const [cellTEditor, setCellTEditor] = useState(0)
    const cellTEditorState = {value: cellTEditor, set: setCellTEditor}
    const cellEditorsStates = {cellNameEditorState,cellSymbolEditorState,cellUnitEditorState,cellLEditorState,cellTEditorState,cellMLTIEditorState}

    const [lawNameEditor, setLawNameEditor] = useState(EditorState.createEmpty())
    const lawNameEditorState = {value: lawNameEditor,set: setLawNameEditor}
    const [lawGroupEditor, setLawGroupEditor] = useState(0)
    const lawGroupEditorState = {value: lawGroupEditor,set: setLawGroupEditor}

    const lawEditorsStates = {lawNameEditorState,lawGroupEditorState}

    const [tableViews, setTableViews] = useState(null)
    const [laws, setLaws] = useState(null)
    const lawsState = {laws, setLaws}

    const [selectedLaw, setSelectedLaw] = useState({law_name: null,cells:[],id_type: null})
    const selectedLawState = {selectedLaw, setSelectedLaw}

    const [lawsGroups, setLawsGroups] = useState([])
    const lawsGroupsState = {lawsGroups, setLawsGroups}

    const [showMode, setShowMode] = useState(false)
    const showModeState = {showMode,setShowMode}

    useEffect(() => {

      const keyDownHandler = event => {

        if (event.key === 'Escape') {
          event.preventDefault();
          setSelectedLaw({law_name: null,cells:[],id_type: null})
          modalsVisibility.lawsModalVisibility.setVisibility(false)
        }
      };
      document.addEventListener('keydown', keyDownHandler);

      return () => {
        document.removeEventListener('keydown', keyDownHandler);
      };

    }, []);


    useEffect(() => {

      async function setSelectedCell() {
        if (selectedCell) {

          if (selectedCell.id_value === -1) {

            convertMarkdownToEditorState(setCellNameEditor, selectedCell.value_name ? selectedCell.value_name :"")
            convertMarkdownToEditorState(setCellSymbolEditor, selectedCell.symbol ? selectedCell.symbol :"")
            convertMarkdownToEditorState(setCellUnitEditor, selectedCell.unit ? selectedCell.unit :"")
            document.getElementById("inputL3").value = selectedCell.l_indicate
            document.getElementById("inputT3").value = selectedCell.t_indicate
            document.getElementById("inputGK3").value = selectedCell.id_gk

            return
          }

          let cellData
          if (selectedCell.g_indicate === undefined && selectedCell.id_value !== 1) {

            const cellResponseData = await getDataFromAPI(`${API_BASE()}/quantities/${selectedCell.id_value}`)
            if (!isResponseSuccessful(cellResponseData)) {
              showMessage(cellResponseData.data.error,"error")
              return
            }
            cellData = cellResponseData.data.data


          } else {cellData = selectedCell}


          convertMarkdownToEditorState(setCellNameEditor, cellData.value_name)
          convertMarkdownToEditorState(setCellSymbolEditor, cellData.symbol)
          convertMarkdownToEditorState(setCellUnitEditor, cellData.unit)
          document.getElementById("inputL3").value = cellData.l_indicate
          document.getElementById("inputT3").value = cellData.t_indicate
          document.getElementById("inputGK3").value = cellData.id_gk
        }  else {
          convertMarkdownToEditorState(setCellNameEditor, "")
          convertMarkdownToEditorState(setCellSymbolEditor, "")
          convertMarkdownToEditorState(setCellUnitEditor, "")
          document.getElementById("inputL3").value = null
          document.getElementById("inputT3").value = null
          document.getElementById("inputGK3").value = null
        }
      }
      setSelectedCell()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCell]);

    const { ref, getImage } = useDownloadableScreenshot();


    return (
      <>
        <UserProfile.Provider value={userInfoState}>
          <TableContext.Provider value={tableState}>

                <TableUI modalsVisibility={modalsVisibility} selectedCellState={selectedCellState} revStates={revStates} gkState={GKLayersState} selectedLawState={selectedLawState} hoveredCellState={hoveredCellState} refTable={ref} lawsGroupsState={lawsGroupsState} lawsState={lawsState} lawEditorsStates={lawEditorsStates} showModeState={showModeState}/>
                <GKLayersImage modalVisibility={GKLayersImageModalVisibility} />
                <Footbar GKLayersImageModalVisibility={GKLayersImageModalVisibility} hoveredCell={hoveredCell} selectedLawState={selectedLawState} getImage={getImage} tableViewState={tableViewState} setTableViews={setTableViews} modalsVisibility={modalsVisibility} showModeState={showModeState} selectedCellState={selectedCellState}/>

                <div id="modal-mask" className='hidden'></div>
                <RegistrationModal modalVisibility={modalsVisibility.regModalVisibility} setUserToken={setUserToken}/>
                <EditCellModal modalVisibility={modalsVisibility.editCellModalVisibility} selectedCell={selectedCell} selectedCellState={selectedCellState} cellEditorsStates={cellEditorsStates} gkColors={GKLayers}/>
                <EditProfileModal modalsVisibility={modalsVisibility} userInfoState={userInfoState}/>
                <EditLawsModal modalsVisibility={modalsVisibility} lawsState={lawsState} selectedLawState={selectedLawState} lawsGroupsState={lawsGroupsState} lawEditorsStates={lawEditorsStates}/>
                <TableViewsModal modalsVisibility={modalsVisibility} tableViews={tableViews} setTableViews={setTableViews} tableViewState={tableViewState} revStates={revStates} selectedLawState={selectedLawState}/>
                <LawsGroupsModal modalsVisibility={modalsVisibility} lawsGroupsState={lawsGroupsState} lawsState={lawsState}/>
                <GKLayersModal modalsVisibility={modalsVisibility} GKLayersState={GKLayersState}/>

                <ToastContainer />
          </TableContext.Provider>
        </UserProfile.Provider>
      </>
    );
}

export function convertMarkdownFromEditorState(state) {

  const html = draftToMarkdown(convertToRaw(state.getCurrentContent())).replace('\n','');
  return html
}

export function showPassword(inputElementRef,eyeElementRef) {
  if(inputElementRef.current.getAttribute("type") === "text") {
    inputElementRef.current.setAttribute('type', 'password');
    eyeElementRef.current.classList.add( "fa-eye-slash" );
    eyeElementRef.current.classList.remove( "fa-eye" );
  } else if(inputElementRef.current.getAttribute("type") === "password"){
    inputElementRef.current.setAttribute('type', 'text');
    eyeElementRef.current.classList.remove( "fa-eye-slash" );
    eyeElementRef.current.classList.add( "fa-eye" );
  }
}
