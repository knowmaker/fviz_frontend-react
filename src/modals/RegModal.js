import React, { useEffect, useRef } from 'react';
import { postDataToAPI } from '../misc/api.js';
import { isResponseSuccessful } from '../misc/api.js';
import { showPassword } from '../pages/Home.js';
import { showMessage } from '../misc/message.js';
import { Modal } from './Modal.js';
import { Button } from '../components/ButtonWithLoad.js';

const API_BASE = () => process.env.REACT_APP_API_LINK;

export function RegistrationModal({ modalVisibility, setUserToken }) {

  useEffect(() => {
    if (modalVisibility.isVisible === false) {
      document.getElementById("InputEmail1").value = "";
      document.getElementById("InputPassword1").value = "";
      document.getElementById("InputEmail2").value = "";
      document.getElementById("InputPassword2").value = "";
      document.getElementById("InputEmail5").value = "";
    }
  }, [modalVisibility.isVisible]);

  const register = async () => {

    const email = document.getElementById("InputEmail1").value;
    const password = document.getElementById("InputPassword1").value;

    const userData = {
      user: {
        email: email,
        password: password,
      }
    };

    const registerResponseData = await postDataToAPI(`${API_BASE()}/users/register`, userData);
    if (!isResponseSuccessful(registerResponseData)) {
      showMessage(registerResponseData.data.error, "error");
      return;
    }

    modalVisibility.setVisibility(false);
    showMessage("Было выслано письмо подтверждения почты");


  };

  const login = async (e) => {

    const email = document.getElementById("InputEmail2").value;
    const password = document.getElementById("InputPassword2").value;
    const userLoginData = {
      user: {
        email: email,
        password: password,
      }
    };

    const loginResponse = await postDataToAPI(`${API_BASE()}/users/login`, userLoginData);

    if (!isResponseSuccessful(loginResponse)) {
      showMessage(loginResponse.data.error, "error");
      return;
    }

    const loginResponseData = loginResponse.data.data;
    setUserToken(loginResponseData);

    modalVisibility.setVisibility(false);
    showMessage("Авторизация успешна");

  };


  const forgotPassword = async () => {

    const email = document.getElementById("InputEmail5").value;

    const userData = {
      user: {
        email: email,
      }
    };

    const resetPasswordResponse = await postDataToAPI(`${API_BASE()}/users/reset`, userData);
    if (!isResponseSuccessful(resetPasswordResponse)) {
      showMessage(resetPasswordResponse.data.error, "error");
      return;
    }
    showMessage("Письмо сброса пароля выслано");
  };

  const clearAllFields = () => {
    document.getElementById("InputEmail1").value = "";
    document.getElementById("InputPassword1").value = "";
    document.getElementById("InputEmail2").value = "";
    document.getElementById("InputPassword2").value = "";
    document.getElementById("InputEmail5").value = "";
  }

  const InputRegisterPassword = useRef();
  const InputRegisterPasswordEye = useRef();

  const InputLoginPassword = useRef();
  const InputLoginPasswordEye = useRef();

  return (
    <Modal
      modalVisibility={modalVisibility}
      title="Авторизация / Регистрация"
      hasBackground={true}
    >
      <div className="modal-content2">

        <nav>
          <div className="nav nav-tabs" id="nav-tab" role="tablist">
            <button className="nav-link active" id="nav-login-tab" data-bs-toggle="tab" data-bs-target="#login" type="button" role="tab" aria-controls="login" aria-selected="true" onClick={clearAllFields}>Авторизация</button>
            <button className="nav-link" id="nav-register-tab" data-bs-toggle="tab" data-bs-target="#register" type="button" role="tab" aria-controls="register" aria-selected="false" onClick={clearAllFields}>Регистрация</button>
            <button className="nav-link" id="nav-forgot-password-tab" data-bs-toggle="tab" data-bs-target="#forgot-password" type="button" role="tab" aria-controls="forgot-password" aria-selected="false" onClick={clearAllFields}>Сброс пароля</button>
          </div>
        </nav>
        <div className="tab-content" id="nav-tabContent">
          <div className="tab-pane fade show active" id="login" role="tabpanel" aria-labelledby="login-tab" tabIndex="0">

            <div className="modal-content2">
              <label htmlFor="InputEmail2" className="form-label">Почта</label>
              <input type="email" className="form-control" id="InputEmail2" aria-describedby="emailHelp" placeholder="name@example.com" />
              <label htmlFor="InputPassword2" className="form-label">Пароль</label>

              <div className="input-group" id="show_hide_password">
                <input type="password" className="form-control" id="InputPassword2" ref={InputRegisterPassword} />
                <div className="input-group-text">
                  <span className='showPassword' onClick={() => { showPassword(InputRegisterPassword, InputRegisterPasswordEye); }}>👁<i className="fa fa-eye-slash" aria-hidden="true" ref={InputRegisterPasswordEye} /></span>
                </div>
              </div>
            </div>

            <div className="modal-footer2">
              <Button className="btn btn-primary" onClick={(e) => login(e)}>Вход</Button>
            </div>
          </div>
          <div className="tab-pane fade" id="register" role="tabpanel" aria-labelledby="register-tab" tabIndex="0">

            <div className="modal-content2">
              <label htmlFor="InputEmail1" className="form-label">Почта</label>
              <input type="email" className="form-control" id="InputEmail1" aria-describedby="emailHelp" placeholder="name@example.com" />
              <label htmlFor="InputPassword1" className="form-label">Пароль</label>
              <div className="input-group" id="show_hide_password">
                <input type="password" className="form-control" id="InputPassword1" ref={InputLoginPassword} />
                <div className="input-group-text">
                  <span className='showPassword' onClick={() => { showPassword(InputLoginPassword, InputLoginPasswordEye); }}>👁<i className="fa fa-eye-slash" aria-hidden="true" ref={InputLoginPasswordEye} /></span>
                </div>
              </div>
            </div>

            <div className="modal-footer2">
              <Button type="button" className="btn btn-primary" onClick={(e) => register(e)}>Регистрация</Button>
            </div>
          </div>
          <div className="tab-pane fade" id="forgot-password" role="tabpanel" aria-labelledby="forgot-password-tab" tabIndex="0">

            <div className="modal-content2">
              <label htmlFor="InputEmail5" className="form-label">Почта</label>
              <input type="email" className="form-control" id="InputEmail5" aria-describedby="emailHelp" placeholder="name@example.com" />
            </div>

            <div className="modal-footer2">
              <Button type="button" className="btn btn-primary" onClick={(e) => forgotPassword(e)}>Сброс</Button>
            </div>
          </div>
        </div>
      </div>


    </Modal>
  );


}
