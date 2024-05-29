import React , {useState , useEffect,useCallback} from "react";
import {NavLink, useNavigate , useLocation} from "react-router-dom";
// import { BounceLoader } from "react-spinners";
import InstAI_icon from '../../image/instai_icon.png'
// import arrow from "../../image/arrow.png"; 這個圖片不好用
import axios from 'axios';
import { Navbar, Nav, Button, Container, Row, Col, Card } from 'react-bootstrap';
import imgTraining from "../../image/imgTraing.png";
import modelTraing from "../../image/modelTraining.png";
import { Modal} from "react-bootstrap";
import instAI_newicon from "../../image/iconnew.png";

function DecisionPage (){
    const location = useLocation();
    const navigate = useNavigate();
    const id = localStorage.getItem("userId");
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get("type");
    const p = process.env;
    const [typeOfProject, setTypeOfProject] = useState(1); //有使用生成的是1 沒有的是2
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalCallback, setModalCallback] = useState(null);

    useEffect(()=>{
    },[]);
    
    const navigateModel = () => {
      setModalMessage("確定直接進行模型訓練?");
      setModalCallback(() => {
        const newTypeOfProject = 2; // 設置新的 typeOfProject 為 2
        setTypeOfProject(newTypeOfProject);
        navigate(`/CreatePage`,{state:{typeOfProject: newTypeOfProject}});
      });
      setShowModal(true);
    }
    
    const navigateImg = () => {
      setModalMessage("確定前往圖片生成?");
      setModalCallback(() => {
        const newTypeOfProject = 1; // 設置新的 typeOfProject 為 1
        setTypeOfProject(newTypeOfProject);
        navigate(`/CreatePage`,{state:{typeOfProject: newTypeOfProject}});
      });
      setShowModal(true);
    }
    
    
    useEffect(() => {
      // console.log("project type is ", typeOfProject);
    }, [typeOfProject]); 

    useEffect(() => {
      if (!showModal && modalCallback) {
        modalCallback();
      }
    }, [showModal]);
    
    const AlertCard =() =>{
      return(
      <Modal show={showModal} onHide={() => setShowModal(false)}>
      <Modal.Header closeButton className="d-flex justify-content-between">
        <Modal.Title></Modal.Title>
        <img src={instAI_newicon} alt="InstAI Icon" style={{ width: '170px', height: '58px', marginLeft: "140px" }} />
      </Modal.Header>
      <Modal.Body className="text-center">{modalMessage}</Modal.Body>
      <Modal.Footer className="justify-content-center">
      <Button variant="secondary" onClick={() => { setShowModal(false); setModalCallback(null); }} className="mr-2">
          NO
       </Button>

        {modalCallback && (
          <Button variant="primary" onClick={() => { modalCallback(); setShowModal(false); }} className="ml-2">
            OK
          </Button>
        )}
      </Modal.Footer>
    </Modal>)
    }

    return (
      <div style={{ backgroundColor: 'white' }}> 
        <Navbar style={{ backgroundColor: 'white' ,boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)'}} >
          <Nav className="mr-auto" style={{marginLeft:"10px"}}>
          <div className="col-auto mt-4"> 
            <NavLink to={`/Project?type=1`} className="projectPageLink">
            <button className="btn createprojectPageButton" style={{ marginLeft: "10px", fontFamily: 'Lato' }}>
              <h3 style={{ marginLeft: "10px" }}>←Back</h3>
            </button>
            </NavLink>
          </div>
            {/* <h3 style={{marginLeft:"10px"}}>Back</h3> */}
          </Nav>
          <Navbar.Brand href="#home" className="mx-auto">
            <img
              src={InstAI_icon}
              width="60"
              height="60"
              className="d-inline-block align-top"
              alt="InstAI logo"
            />
            {' '}InstAI
          </Navbar.Brand>
        </Navbar>
        <Container className="d-flex flex-column justify-content-center" style={{ 
          minHeight: '60vh', maxWidth: '50rem', margin: '50px auto', 
          backgroundColor: 'white', borderRadius: '15px',boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)' 
          }}>
        <h2 className="text-center" style={{ marginLeft: "10px", fontFamily: 'Lato', fontStyle: 'normal' }}>What would you like to try?</h2>
        <Row className="justify-content-around">
          <Col md={5}>
            <Card>
              <Card.Body>
                <img
                src={modelTraing}
                width='70'
                height='70'
                className="d-inline-block align-top"
                alt="modelTraing"
                />
                <Card.Title>AI Model Training</Card.Title>
                <Card.Text>Dorem ipsum dolor sit amet, consectetur adipiscing elit.</Card.Text>
                <Button variant="primary" style={{width:"100%"}} onClick={navigateModel}>Choose</Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={5}>
            <Card>
              <Card.Body>
              <img
                src={imgTraining}
                width='70'
                height='70'
                className="d-inline-block align-top"
                alt="modelTraing"
                />
                <Card.Title>Image Generation</Card.Title>
                <Card.Text>Generate 25 image data for AI model training for free</Card.Text>
                <Button variant="primary" style={{width:"100%"}} onClick={navigateImg}>Choose</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <AlertCard/>
      </div>
    );
  };


export default DecisionPage;