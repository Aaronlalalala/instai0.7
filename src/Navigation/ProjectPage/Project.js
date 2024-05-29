import React, { useState, useEffect } from "react";
import "./Project.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { BounceLoader } from 'react-spinners';
import InstAI_icon from '../../image/instai_icon.png';
import { Modal, Button } from "react-bootstrap";
import instAI_newicon from "../../image/iconnew.png";

function Project() {
  const location = useLocation();
  const userid = localStorage.getItem("userId");
  const searchParams = new URLSearchParams(location.search);
  const id = localStorage.getItem("userId");
  const type = searchParams.get("type");
  const navigate = useNavigate();
  const [projectList, setProjectList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [diffusionType, setDiffusionType] = useState();
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const g_r = process.env.REACT_APP_GET_PROJECT;
  const d_p = process.env.REACT_APP_DELETE_PROJECT;
  const [isLoading, setIsLoading] = useState(false);
  let isMounted = true;
  const g_s = process.env.REACT_APP_GET_STEP;
  const g_c = process.env.REACT_APP_GET_IMGCOUNT;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalCallback, setModalCallback] = useState(null);

  const getCount = async (projectname) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`${g_c}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        params: { projectname: projectname, username: id }
      });

      if (response.data === 'error') {
        throw new Error('Error fetching data');
      }
      let chance = response.data.img_generation_remaining_count;
      return chance;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("jwtToken");
        const response = await axios.get(`${g_r}/?username=${type ? id : userid}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        setProjectList(response.data);
      } catch (error) {
        if (error.response.status === 403) {
          if (isMounted) {
            isMounted = false;
            setModalMessage("Timed out, please log in again!");
            setModalCallback(() => () => navigate("/"));
            setShowModal(true);
          } else {
            console.error('獲取數據時出錯', error);
          }
        } else {
          console.error("An error occurred:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [g_r, id, type, userid, navigate]);

  const fetchstep = async (projectname) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(
        `${g_s}/?username=${userid}&projectname=${projectname}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      if (response.data === 'error') {
        throw new Error('Error fetching data');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  const Loading = () => (
    <div className="loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <BounceLoader color={'black'} loading={isLoading} size={120} />
    </div>
  );

  const handleDeleteProject = async (projectname, index) => {
    setModalMessage("Sure to delete the project ?");
    setModalCallback(() => async () => {
      const updatedProjects = [...projectList];
      const deletedProject = updatedProjects.splice(index, 1)[0];
      localStorage.removeItem(`${deletedProject.name}type`);
      localStorage.removeItem(`confirmStatusImg_${id}_${projectname}`);
      localStorage.removeItem(`confirmStatusReq_${id}_${projectname}`);
      localStorage.removeItem(`${projectname} checkPoint`);
      localStorage.removeItem("traing name");
      localStorage.removeItem(`${projectname}prmoptData`);
      setProjectList(updatedProjects);

      try {
        const token = localStorage.getItem("jwtToken");
        const response = await axios.post(
          `${d_p}/?username=${type ? id : userid}`,
          { projectName: projectname },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        setModalMessage(response.data);
        setModalCallback(null);
      } catch (error) {
        console.error("Error sending data to backend:", error);
      }
    });
    setShowModal(true);
  };

  const handleNavigate = async (project) => {
    try {
      const ProjectType = project.Type;
      const status = await fetchstep(project.project_name);
      const chance = await getCount(project.project_name);
      const checkPoint = localStorage.getItem(`${project.project_name} checkPoint`);

      if (ProjectType === "Image generation") {
        const newProjectname = project.project_name;
        localStorage.setItem("traing name", newProjectname);
        if (status === "Image generation") {
          if (chance < 1) {
            navigate(`/ImgDisplayPage`);
            return;
          } else {
            if (checkPoint) {
              navigate(`/PromptInputPage`);
              return;
            }

            navigate(`/ModelSelectionPage`);
            return;
          }
        } else {
          const newType = 1;
          setDiffusionType(newType);
          navigate(`/Step?project=${project.project_name}`);
        }
      } else {
        const newType = 2;
        setDiffusionType(newType);
        navigate(`/Step?project=${project.project_name}`);
      }
    } catch (error) {
      setModalMessage('目前遇到錯誤');
      setModalCallback(null);
      setShowModal(true);
    }
  };

  const handleLogout = () => {
    setModalMessage("確定要登出嗎？");
    setModalCallback(() => () => {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem("userId");
      localStorage.removeItem('Role');
      navigate("/");
    });
    setShowModal(true);
  };

  const ProjectCard = ({ project, index, handleDeleteProject, handleNavigate }) => {
    const isProjectInLocalStorage = localStorage.getItem(`${project.name}type`) === '1';
    const projectClass = project.Type === "Image generation" ? 'project-blue' : 'project';
    const typeCheck = isProjectInLocalStorage ? 'diffusion dataset' : "";
    return (
      <div className={`col-lg-2 col-md-3 mb-4 mt-3 ${projectClass}`} key={index}>
        <div className="project-list-grid">
          <h2 className="project-Name fs-4 fw-bold">{project.project_name}<p className="project-imgnum fw-semibold mt-2">Including: {project.img_quantity} imgs</p></h2>
          <div className="projectNavLink">
            <p>Status: {project.status}</p>
            <p className="">Type: {project.Type}</p>
            <p className="project-Detial">Description: {project.project_description}<br />{typeCheck}</p>
          </div>
          <div className="project-Delete">
            <button className="btn deleteButton" onClick={() => handleDeleteProject(project.project_name, index)}>刪除專案</button>
          </div>
          <div className="project-Nav" style={{ marginLeft: '110px' }}>
            <button className="btn deleteButton" onClick={() => handleNavigate(project)}>進入專案</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid mt-3">
      <div className="row d-flex justify-content-between">
        <div className="col-auto">
          <img src={InstAI_icon} className="img-fluid" alt="InstAi_Icon" style={{ width: '76.8px', height: '76.8px' }}></img>
        </div>
        <div className="col-auto mt-4">
          <button className="btn logoutButton" onClick={handleLogout}>登出</button>
        </div>
        <div className="custom-border"></div>
      </div>

      <div className="row">
        <div className="col-12">
          <h1 className="mt-3" style={{ fontWeight: 'bold' }}>Projects</h1>
        </div>
      </div>

      <div className="row d-flex justify-content-between">
        <div className="col-auto">
          <input
            className="form-control"
            type="text"
            placeholder="搜尋專案"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="col-auto">
          <NavLink to={`/CreateProjectPage`}>
            <button className="btn add-project-button">新增專案</button>
          </NavLink>
        </div>
      </div>

      <div className="row ml-3" style={{ marginLeft: 3 }}>
        {isLoading ? <Loading /> : projectList.map((project, index) => <ProjectCard project={project} key={index} index={index} handleDeleteProject={handleDeleteProject} handleNavigate={handleNavigate} />)}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="d-flex justify-content-between">
          <Modal.Title></Modal.Title>
          <img src={instAI_newicon} alt="InstAI Icon" style={{ width: '170px', height: '58px', marginLeft: "140px" }} />
        </Modal.Header>
        <Modal.Body className="text-center">{modalMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            No
          </Button>
          {modalCallback && (
            <Button variant="primary" onClick={() => { modalCallback(); setShowModal(false); }}>
              Yes
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Project;
