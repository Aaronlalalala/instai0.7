import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "./Create.css";
import axios from "axios";
import InstAI_icon from '../../image/instai_icon.png';
import { Modal, Button } from "react-bootstrap";
import instAI_newicon from "../../image/iconnew.png";


function Create() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const id = localStorage.getItem("userId");
  const [response, setResponse] = useState(null); 
  const add_p = process.env.REACT_APP_ADD_PROJECT;
  const c_s = process.env.REACT_APP_CONFIRM_STEP;
  const type = searchParams.get("type");
  const [projectList, setProjectList] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalCallback, setModalCallback] = useState(null);
  
  const type_project = location.state.typeOfProject;
  const typeString = type_project === 2 ? "AI Model training" : "Image generation";

  const [formData, setFormData] = useState({
    projectName: "",
    devices: [],
    projectDescription: "",
    type: typeString
  });

  const g_r = process.env.REACT_APP_GET_PROJECT;

  useEffect(() => {
    let isMounted = true; 
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        const response = await axios.get(`${g_r}/?username=${type ? id : id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (isMounted) {
          setProjectList(response.data);
        }
      } catch (error) {
        if (error.response.status === 403) {
          if (isMounted) {
            console.error('獲取數據時出錯', error);
            setModalMessage("Timed out, please log in again!");
            setModalCallback(() => () => navigate("/"));
            setShowModal(true);
          } else {
            console.error('獲取數據時出錯', error);
          }
        } else {
          console.error("An error occurred:", error);
        }
      }
    };
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [g_r, id, type, navigate]);

  const handleFormDataChange = (fieldName, value) => {
    if (fieldName === "projectDescription" && value.length > 50) {
      setModalMessage("限制字數在50字內");
      setShowModal(true);
      value = value.substring(0, 50);
    } 
    if (fieldName === "projectName" && /[^a-zA-Z0-9\-_ ]/.test(value)) {
      setModalMessage("專案名稱只能包含英文字符和數字");
      setShowModal(true);
      return;
    }
    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
  };

  const changeStep = async (status_now, projectname) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const formData = { step: status_now, projectname: projectname, username: id };
      await axios.post(
        `${c_s}`, formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  const addProject = async () => {
    if (formData.projectName.trim() === "") {
      setModalMessage("請輸入專案名稱");
      setShowModal(true);
    } else {
      const existingProject = projectList.find(project => project.project_name === formData.projectName.trim());
      if (existingProject) {
        setModalMessage("已經有相同的專案名稱了，請改名");
        setShowModal(true);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.post(
          `${add_p}?username=${id}`,
          {
            projectName: formData.projectName.trim(),
            projectDescription: formData.projectDescription.trim(),
            type: formData.type.trim()
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        let projectName = formData.projectName.trim();
        setResponse(response.data);    
        handleFormDataChange("projectName", "");
        handleFormDataChange("projectDescription", ""); 
        setLoading(false);

        if(type_project === 2) {
          await changeStep("Image upload", projectName);
          localStorage.setItem(`${projectName}type`, 2);
          navigate(`/Project?&type=1`);
          return;
        } else {
          localStorage.setItem(`${projectName}type`, 1);
          navigate(`/Project?&type=1`);
          return;
        }   
      } catch (error) { 
        console.error("Error sending data to backend:", error);
      }
    }
  };

  useEffect(() => {
    if (response) {
      setModalMessage(response);
      setShowModal(true);
    }
  }, [response]); 

return (
  <div className="container-fluid mt-3">
    <div className="row d-flex justify-content-between">
      <div className="col-auto"> 
        <img src={InstAI_icon} className="img-fluid" alt="InstAi_Icon" style={{ width: '76.8px', height: '76.8px' }} ></img>
      </div>

      <div className="col-auto mt-4"> 
        <NavLink to={`/Project?id=${id}&type=1`} className="projectPageLink">
          <button className="btn projectPageButton">返回專案頁面</button>
        </NavLink>
      </div>
      <div className="custom-border"></div>
    </div>

    {loading ? (
      <div className="hourglass"></div>
    ) : (
      <div className="card col-xl-5 create-form" style={{ height: 550 }}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div>
            <h1 className="display-4 text-center create-title" style={{ fontWeight: 'bold' }}>Create Projects</h1>
          </div>
          <div className="createProjectName">
            <label className="form-label fs-6">專案名稱：</label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={(e) => handleFormDataChange("projectName", e.target.value)}
              className="form-control fs-6"
            />
          </div>
          <div className="createProjectDescription">
            <label className="form-label fs-6">專案描述：</label>
            <textarea
              name="projectDescription"
              value={formData.projectDescription}
              onChange={(e) => handleFormDataChange("projectDescription", e.target.value)}
              className="form-control fs-6"
              rows="3"
            ></textarea>
          </div>
          <button className="btn createButton mt-3" type="button" onClick={addProject}>
            新增專案
          </button>
        </form>
      </div>
    )}

    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="d-flex justify-content-between">
          <Modal.Title></Modal.Title>
          <img src={instAI_newicon} alt="InstAI Icon" style={{ width: '170px', height: '58px' , marginLeft:"140px" }} />
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            關閉
          </Button>
          {modalCallback && (
            <Button variant="primary" onClick={() => { modalCallback(); setShowModal(false); }}>
              確認
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  </div>
);
  
}

export default Create;
