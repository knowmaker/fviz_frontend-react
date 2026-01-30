import React, { useRef } from 'react';
import { patchDataToAPI, deleteDataFromAPI } from '../misc/api.js';
import { UserProfile } from '../misc/contexts.js';
import { isResponseSuccessful } from '../misc/api.js';
import { showPassword } from '../pages/Home.js';
import { showMessage } from '../misc/message.js';
import { Modal } from './Modal.js';
import { Button } from '../components/ButtonWithLoad.js';
import setStateFromGetAPI from '../misc/api.js';

const API_BASE = () => process.env.REACT_APP_API_LINK;

export function EditProfileModal({ modalsVisibility, userInfoState }) {

  const modalVisibility = modalsVisibility.editProfileModalVisibility;
  const headers = {
    Authorization: `Bearer ${userInfoState.userToken}`
  };

  const editProfile = async () => {

    const firstName = document.getElementById("InputFirstName3").value;
    const lastName = document.getElementById("InputLastName3").value;
    const patronymic = document.getElementById("InputPatronymic3").value;
    const password = document.getElementById("InputPassword3").value;

    let newUserData = {
      user: {
        last_name: lastName,
        first_name: firstName,
        patronymic: patronymic,
      }
    };

    if (password !== "") {
      newUserData.user.password = password;
    }

    const editUserResponse = await patchDataToAPI(`${API_BASE()}/users/update`, newUserData, headers);
    if (!isResponseSuccessful(editUserResponse)) {
      showMessage(editUserResponse.data.error, "error");
      return;
    }

    modalVisibility.setVisibility(false);
    showMessage("Профиль обновлён");

    document.getElementById("InputEmail2").value = "";
    document.getElementById("InputPassword2").value = "";
    document.getElementById("InputEmail1").value = "";
    document.getElementById("InputPassword1").value = "";

    setStateFromGetAPI(userInfoState.setUserProfile, `${API_BASE()}/users/profile`, undefined, headers )

  };

  const deleteUser = async () => {
    if (!window.confirm("Вы уверены что хотите это сделать? Это приведёт к последствиям для других пользователей.")) {
      return;
    }

    const deleteUserResponse = await deleteDataFromAPI(`${API_BASE()}/delete`, undefined, headers);
    if (!isResponseSuccessful(deleteUserResponse)) {
      showMessage(deleteUserResponse.data.error, "error");
      return;
    }
    showMessage("Аккаунт удалён");
    userInfoState.setUserToken(null);

  };

  const InputPassword = useRef();
  const InputPasswordEye = useRef();

  return (
    <Modal
      modalVisibility={modalVisibility}
      title="Редактирование профиля"
      hasBackground={true}
    >
      <div className="modal-content2">

        <label htmlFor="InputEmail3" className="form-label">Почта</label>
        <input type="email" className="form-control" id="InputEmail3" aria-describedby="emailHelp" placeholder="name@example.com" disabled={true} />
        <label htmlFor="InputLastName3" className="form-label">Новый пароль</label>
        <div className="input-group" id="show_hide_password">
          <input type="password" className="form-control" id="InputPassword3" ref={InputPassword} />
          <div className="input-group-text">
            <span className='showPassword' onClick={() => { showPassword(InputPassword, InputPasswordEye); }}>👁<i className="fa fa-eye-slash" aria-hidden="true" ref={InputPasswordEye} /></span>
          </div>
        </div>
        <label htmlFor="InputLastName3" className="form-label">Фамилия</label>
        <input type="text" className="form-control" id="InputLastName3" />
        <label htmlFor="InputFirstName3" className="form-label">Имя</label>
        <input type="text" className="form-control" id="InputFirstName3" />
        <label htmlFor="InputPatronymic3" className="form-label">Отчество</label>
        <input type="text" className="form-control" id="InputPatronymic3" />
      </div>
      <div className="modal-footer2">
        <Button type="button" className="btn btn-danger me-1" onClick={(e) => deleteUser(e)}>Удалить аккаунт</Button>
        <Button type="button" className="btn btn-success" onClick={(e) => editProfile(e)}>Сохранить</Button>
      </div>

    </Modal>
  );
}
