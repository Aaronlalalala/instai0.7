import React, { useState, Fragment, useEffect } from "react";
import basestyle from "../Base.module.css";
import loginstyle from "./Login.module.css";
import axios from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import InstAI_icon from '../../image/iconnew.png';
import { jwtDecode } from 'jwt-decode';
import MeteorShower from "./MeteorShower";
import backgroundImg from "../../image/background.jpg";
import { Alert } from 'react-bootstrap';

const Login = ({ setUserState }) => {
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const log_in = process.env.REACT_APP_LOG_IN;
  const admin_password = process.env.REACT_APP_PASSWORD;
  const admin_email = process.env.REACT_APP_EMAIL;
  const [user, setUserDetails] = useState({
    email: "",
    password: "",
  });
  const [decodedToken, setDecodedToken] = useState();
  const [background, setBackground] = useState(1);

  // 新增狀態來控制警報訊息的顯示
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState(''); // 用於設置警報訊息的類型

  useEffect(() => {
    if (isSubmit && Object.keys(formErrors).length === 0) {
      const login = async () => {
        try {
          const response = await axios.post(log_in, user);
          if (response.data && response.data === "Failed") {
            setAlertMessage('登錄失敗！');
            setAlertVariant('danger');
            setIsSubmit(false);
          } else if (response.data.message && response.data.message.includes("Admin Success")) {
            setAlertMessage('Admin登錄成功！');
            setAlertVariant('success');
            const token = response.data.token;
            localStorage.setItem("jwtToken", token);
            const decoded = jwtDecode(token);
            setDecodedToken(decoded);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const remove = "Success";
            const id = response.data.message.replace(remove, "");
            localStorage.setItem("Role", decoded.role);
            console.log("Admin login detected!");
            navigate("/AdminOverView", { state: id });
          } else {
            setAlertMessage('登錄成功！');
            setAlertVariant('success');
            const token = response.data.token;
            localStorage.setItem("jwtToken", token);
            const decoded = jwtDecode(token);
            setDecodedToken(decoded);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const remove = "Success";
            const id = response.data.message.replace(remove, "");
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = localStorage.setItem("userId", payload.user);
            localStorage.setItem("Role", decoded.role);
            console.log("Regular user login detected!");

            const userRole = localStorage.getItem('Role');
            console.log(userRole);
            if (userRole === "normal_user") {
              navigate("/Project", { state: id });
            } else if (userRole === "internal_user") {
              navigate("/InternalOverView", { state: id });
            }
          }
        } catch (error) {
          console.error('登錄時出錯', error);
          setAlertMessage('登錄時出錯');
          setAlertVariant('danger');
          setIsSubmit(false);
        }
      };
      login();
    }
  }, [isSubmit]);

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setUserDetails((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const validateForm = (values) => {
    const error = {};
    const regex = /^[^\s+@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!values.email) {
      error.email = "Email is required for login";
    } else if (!regex.test(values.email)) {
      error.email = "Please enter a valid email address";
    }
    if (!values.password) {
      error.password = "Password is required for login";
    }
    return error;
  };

  const loginHandler = (e) => {
    e.preventDefault();
    const errors = validateForm(user);
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      setIsSubmit(true);
    }
  };

  const handleSwitchBackground = () => {
    setBackground(preBackground => (preBackground === 0 ? 1 : 0));
  };

  return (
    background === 0 ? (
      <Fragment>
        <div className="container" style={{ marginTop: "30vh" }}>
          <div className="row">
            <div className="col-md-3 mx-auto">
              <img src={InstAI_icon} className="img-fluid" alt="InstAi_Icon" ></img>
            </div>
          </div>
          <div className="row">
            <div className="col-md-5 mx-auto">
              <div className={`card rounded-5 ${loginstyle.logincard}`}>
                <div className="card-body">
                  <h3 className="card-title text-center " style={{ fontWeight: 'bold' }}>Sign in</h3>
                  {alertMessage && (
                    <Alert variant={alertVariant} onClose={() => setAlertMessage('')} dismissible>
                      {alertMessage}
                    </Alert>
                  )}
                  <form onSubmit={loginHandler}>
                    <label className="form-label fs-6 mt-2 mb-1 fw-bold">Email</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      onChange={changeHandler}
                      value={user.email}
                      className="form-control fs-6 mt-1 mb-1"
                    />
                    <p className={`text-center ${basestyle.error}`}>{formErrors.email}</p>
                    <label className="form-label fs-6 mt-1 mb-1 fw-bold">Password</label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      onChange={changeHandler}
                      value={user.password}
                      className="form-control fs-6 mt-1 mb-1"
                    />
                    <p className={`text-center ${basestyle.error}`}>{formErrors.password}</p>
                    <button type="submit" className={`btn ${basestyle.button_common}`}>
                      SIGN IN
                    </button>
                    <NavLink className={`nav-link text-center text-primary `} style={{ fontWeight: 'bold' }} to="/">
                      Create a new account
                    </NavLink>
                  </form>
                  <div className="container-fluid mt-3 d-flex justify-content-center">
                    <button className="btn bt-sm btn-primary " onClick={handleSwitchBackground}>Switch background</button>
                  </div>
                </div>
              </div>
              <div className="text-center mt-3">
                Have questions? Send email to <b>support@instai.co</b>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    ) : (
      <div style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        overflow: 'hidden',
        zIndex: -1
      }}>
        <MeteorShower />
        <React.Fragment>
          <div className="container" style={{ marginTop: "30vh" }}>
            <div className="row">
              <div className="col-md-5 mx-auto">
                <div className={`card rounded-5 ${loginstyle.logincard}`}>
                  <div className="text-center">
                    <img src={InstAI_icon} className="img-fluid" alt="InstAi_Icon" style={{ width: '300px', height: 'auto' }}></img>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title text-center" style={{ fontWeight: 'bold' }}>Sign in</h3>
                    {alertMessage && (
                      <Alert variant={alertVariant} onClose={() => setAlertMessage('')} dismissible>
                        {alertMessage}
                      </Alert>
                    )}
                    <form onSubmit={loginHandler}>
                      <label className="form-label fs-6 mt-2 mb-1 fw-bold">Email</label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        onChange={changeHandler}
                        value={user.email}
                        className="form-control fs-6 mt-1 mb-1"
                      />
                      <p className={`text-center ${basestyle.error}`}>{formErrors.email}</p>
                      <label className="form-label fs-6 mt-1 mb-1 fw-bold">Password</label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        onChange={changeHandler}
                        value={user.password}
                        className="form-control fs-6 mt-1 mb-1"
                      />
                      <p className={`text-center ${basestyle.error}`}>{formErrors.password}</p>
                      <button type="submit" className={`btn ${basestyle.button_common}`}>
                        SIGN IN
                      </button>
                      <NavLink className={`nav-link text-center text-primary `} style={{ fontWeight: 'bold' }} to="/">
                        Create a new account
                      </NavLink>
                    </form>
                    <div className="container-fluid mt-3 d-flex justify-content-center">
                      <button className="btn bt-sm btn-primary " onClick={handleSwitchBackground}>Switch background</button>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3" style={{ color: 'white' }}>
                  Have questions? Send email to <b>support@instai.co</b>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      </div>
    )
  );
};

export default Login;
