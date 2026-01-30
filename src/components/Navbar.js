import React from 'react';
import { TableContext, UserProfile } from '../misc/contexts.js';
import { useContext } from 'react';
import { toast } from 'react-toastify';


export default function Navbar({revStates, modalsVisibility}) {

    const tableState = useContext(TableContext)

    const undoStack = revStates.undoStack
    const setUndoStack = revStates.setUndoStack
    const redoStack = revStates.redoStack
    const setRedoStack = revStates.setRedoStack
    const setData = tableState.setTableData
    const data = tableState.tableData
    const currentData = data;

    const undo = () => {
        if (undoStack.length > 0) {
            const previousData = undoStack[undoStack.length - 1];

            setRedoStack([...redoStack, currentData]);
            setUndoStack(undoStack.slice(0, undoStack.length - 1));
            setData(previousData);
        }
    };

    const redo = () => {
        if (redoStack.length > 0) {
            const nextData = redoStack[redoStack.length - 1];

            setUndoStack([...undoStack, currentData]);
            setRedoStack(redoStack.slice(0, redoStack.length - 1));
            setData(nextData);
        }
    };

    const openRegistrationForm = () => {

        document.querySelector('#nav-tab button[data-bs-target="#register"]').click()
        modalsVisibility.regModalVisibility.setVisibility(true)
    }

    const openLoginForm = () => {

        document.querySelector('#nav-tab button[data-bs-target="#login"]').click()
        modalsVisibility.regModalVisibility.setVisibility(true)
    }

    const userInfoState = useContext(UserProfile)

    let isAuthorized = false;
    if (userInfoState.userProfile) {
        isAuthorized = true;
    }

    const signOut = () => {

        userInfoState.setUserProfile(null)
        userInfoState.setUserToken(null)

        toast.success("Сеанс завершен", {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            progress: undefined,
            theme: "colored",
          });

        localStorage.removeItem('token')

    }

    const openProfileForm = () => {
        closeAllModals(modalsVisibility)
        modalsVisibility.editProfileModalVisibility.setVisibility(true)
    }

    const openTableViewsForm = () => {
        closeAllModals(modalsVisibility)
        modalsVisibility.tableViewsModalVisibility.setVisibility(true)
    }

    const openLawsGroupsForm = () => {
        closeAllModals(modalsVisibility)
        modalsVisibility.lawsGroupsModalVisibility.setVisibility(true)
    }

    const openGKColorsEditForm = () => {
        closeAllModals(modalsVisibility)
        modalsVisibility.GKColorsEditModalVisibility.setVisibility(true)
    }

    const openLawsMenu = () => {
        closeAllModals(modalsVisibility)
        modalsVisibility.LawsMenuVisibility.setVisibility(true)
    }

    let loginButtons;

    if (userInfoState.userProfile) {
        loginButtons = (
            <>
                <span onClick={() => openProfileForm()} style={{cursor: "pointer"}}>{userInfoState.userProfile.first_name} (Мой профиль)</span>
                <span style={{margin:10}}>/</span>
                <span onClick={() => signOut()} style={{cursor: "pointer"}}>Выход</span>
            </>
        )
    }
    else
    {
        loginButtons = (
            <>
                <span onClick={() => openLoginForm()} style={{cursor: "pointer"}}>Вход</span>
                <span style={{margin:10}}>/</span>
                <span onClick={() => openRegistrationForm()} style={{cursor: "pointer"}}>Регистрация</span>
            </>
        )
    }

    return (
        <nav className="navbar navbar-expand-lg fixed-top bg-body-tertiary">

            <div className="container-fluid">
                <a className="navbar-brand" href='https://fviz.ru' data-bs-toggle="tooltip" data-bs-placement="bottom" title="Made by: Voronin © Web FViZ, 2023">ФВиЗ</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <div className="navbar-nav">
                        {isAuthorized ?
                        (<>
                        <div className={`nav-link ${undoStack.length === 0 ? "" : "active"}`} aria-current="page" onClick={undo}>↺Отмена</div>
                        <div className={`nav-link ${redoStack.length === 0 ? "" : "active"}`} aria-current="page" onClick={redo}>↻Возврат</div>
                        <div className="nav-link active" aria-current="page" onClick={openTableViewsForm}>Представления</div>
                        <div className="nav-link active" aria-current="page" onClick={openLawsMenu}>Законы</div>
                        <div className="nav-link active" aria-current="page" onClick={openLawsGroupsForm}>Группы законов</div>
                        <div className="nav-link active" aria-current="page" onClick={openGKColorsEditForm}>Цвета ячеек</div>
                        </>) : (null)}
                    </div>
                </div>
                <div className="navbar-text">
                    {loginButtons}
                </div>
            </div>
        </nav>
    );
}

export function closeAllModals(modalsVisibility) {

    for (const [, modal] of Object.entries(modalsVisibility)) {
        modal.setVisibility(false)
    }

}
